import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { loadEnvFile } from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { Client, Functions } from "node-appwrite";
import { InputFile } from "node-appwrite/file";

try { loadEnvFile(".env.local"); } catch (error) { if (error?.code !== "ENOENT") throw error; }

const required = ["NEXT_PUBLIC_APPWRITE_ENDPOINT", "NEXT_PUBLIC_APPWRITE_PROJECT_ID", "APPWRITE_API_KEY"];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) throw new Error(`Missing environment variables: ${missing.join(", ")}`);

const config = JSON.parse(readFileSync("appwrite.config.json", "utf8"));
const requested = new Set(process.argv.slice(2));
const definitions = config.functions.filter((definition) => !requested.size || requested.has(definition.$id));
if (!definitions.length) throw new Error("No matching Appwrite functions were selected.");

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);
const functions = new Functions(client);
const temporaryDirectory = mkdtempSync(join(tmpdir(), "lifeinbox-functions-"));

function isNotFound(error) {
  return Number(error?.code) === 404;
}

function functionConfiguration(definition) {
  return {
    functionId: definition.$id,
    name: definition.name,
    runtime: definition.runtime,
    execute: definition.execute ?? [],
    events: definition.events ?? [],
    schedule: definition.schedule ?? "",
    timeout: definition.timeout ?? 15,
    enabled: definition.enabled ?? true,
    logging: definition.logging ?? true,
    entrypoint: definition.entrypoint,
    commands: definition.commands,
    scopes: definition.scopes ?? [],
    specification: definition.runtimeSpecification ?? definition.buildSpecification,
  };
}

async function reconcileFunction(definition) {
  const configuration = functionConfiguration(definition);
  try {
    await functions.get({ functionId: definition.$id });
    await functions.update(configuration);
    console.log(`Reconciled ${definition.$id} settings from appwrite.config.json`);
  } catch (error) {
    if (!isNotFound(error)) throw error;
    await functions.create(configuration);
    console.log(`Created ${definition.$id} from appwrite.config.json`);
  }
}

async function ensureModelVariable(functionId) {
  if (functionId !== "ai-orchestrator") return;
  const desiredModel = "gpt-5.6-terra";
  const list = await functions.listVariables({ functionId });
  const current = list.variables.find((variable) => variable.key === "OPENAI_MODEL");
  if (current) {
    await functions.updateVariable({ functionId, variableId: current.$id, key: "OPENAI_MODEL", value: desiredModel, secret: false });
    console.log(`Updated ${functionId} OPENAI_MODEL=${desiredModel}`);
  } else {
    await functions.createVariable({ functionId, key: "OPENAI_MODEL", value: desiredModel, secret: false });
    console.log(`Created ${functionId} OPENAI_MODEL=${desiredModel}`);
  }
}

async function deploy(definition) {
  await reconcileFunction(definition);
  await ensureModelVariable(definition.$id);
  const sourceDirectory = resolve(definition.path);
  const archivePath = join(temporaryDirectory, `${definition.$id}.tar.gz`);
  const tar = spawnSync(process.platform === "win32" ? "tar.exe" : "tar", ["-czf", archivePath, "-C", sourceDirectory, "."], {
    encoding: "utf8",
  });
  if (tar.status !== 0) throw new Error(`Could not package ${definition.$id}: ${tar.stderr || tar.stdout}`);

  const deployment = await functions.createDeployment({
    functionId: definition.$id,
    code: InputFile.fromPath(archivePath, basename(archivePath)),
    activate: true,
    entrypoint: definition.entrypoint,
    commands: definition.commands,
  });
  console.log(`Queued ${definition.$id} deployment ${deployment.$id}`);

  for (let attempt = 0; attempt < 120; attempt += 1) {
    const current = await functions.getDeployment({ functionId: definition.$id, deploymentId: deployment.$id });
    if (current.status === "ready") {
      console.log(`Deployment ${deployment.$id} for ${definition.$id} is ready and active`);
      return;
    }
    if (current.status === "failed") throw new Error(`${definition.$id} build failed:\n${current.buildLogs || "No build log returned."}`);
    await delay(2500);
  }
  throw new Error(`Timed out waiting for ${definition.$id} deployment ${deployment.$id}.`);
}

try {
  for (const definition of definitions) await deploy(definition);
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
