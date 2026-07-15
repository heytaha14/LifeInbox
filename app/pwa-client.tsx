"use client";

import { useEffect, useState } from "react";
import { Download, Share2, WifiOff, X } from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaClient() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [isIos] = useState(() => typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent));
  const [isStandalone, setIsStandalone] = useState(() => typeof window !== "undefined" && (window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone)));
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine !== false);

  useEffect(() => {
    let refreshing = false;
    let registration: ServiceWorkerRegistration | null = null;
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => { setIsStandalone(true); setInstallPrompt(null); };
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    const refreshWorker = () => { if (document.visibilityState === "visible") void registration?.update(); };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
      const register = async () => {
        registration = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
        await registration.update();
        registration.waiting?.postMessage("SKIP_WAITING");
      };
      if (document.readyState === "complete") void register();
      else window.addEventListener("load", register, { once: true });
      document.addEventListener("visibilitychange", refreshWorker);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      navigator.serviceWorker?.removeEventListener("controllerchange", onControllerChange);
      document.removeEventListener("visibilitychange", refreshWorker);
    };
  }, []);

  async function install() {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") setInstallPrompt(null);
      return;
    }
    if (isIos) setShowIosHelp(true);
  }

  const canOfferInstall = !isStandalone && !dismissed && (Boolean(installPrompt) || isIos);

  return <>
    {!online && <div className="offline-pill" role="status"><WifiOff size={15} /> You&apos;re offline. Saved screens remain available.</div>}
    {canOfferInstall && <aside className="install-card" aria-label="Install LifeInbox">
      <button className="install-close" onClick={() => setDismissed(true)} aria-label="Dismiss install suggestion"><X size={15} /></button>
      <span className="install-icon"><Download size={20} /></span>
      <div><b>Keep LifeInbox one tap away</b><p>{showIosHelp ? <>Tap <Share2 size={13} /> <strong>Share</strong>, then choose <strong>Add to Home Screen</strong>.</> : "Install the app for a focused, full-screen experience."}</p></div>
      {!showIosHelp && <button className="install-action" onClick={() => void install()}>Install app</button>}
    </aside>}
  </>;
}
