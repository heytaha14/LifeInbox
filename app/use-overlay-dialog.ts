"use client";

import { useEffect, useRef, type RefObject } from "react";

let overlayLocks = 0;
let previousBodyOverflow = "";
let previousOverscrollBehavior = "";
const overlayStack: symbol[] = [];

const focusableSelector = [
  "[data-autofocus]",
  "button:not([disabled])",
  "input:not([disabled])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  "a[href]",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function hasActiveOverlayDialog() {
  return overlayStack.length > 0;
}

export function useOverlayDialog<T extends HTMLElement>(
  onClose: () => void,
  options: { active?: boolean; disabled?: boolean; focusOnOpen?: boolean } = {},
): RefObject<T | null> {
  const dialogRef = useRef<T>(null);
  const onCloseRef = useRef(onClose);
  const overlayIdRef = useRef(Symbol("lifeinbox-overlay"));

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (options.active === false) return;
    const overlayId = overlayIdRef.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    overlayStack.push(overlayId);
    overlayLocks += 1;
    if (overlayLocks === 1) {
      previousBodyOverflow = document.body.style.overflow;
      previousOverscrollBehavior = document.body.style.overscrollBehavior;
      document.body.style.overflow = "hidden";
      document.body.style.overscrollBehavior = "none";
    }

    const focusTimer = options.focusOnOpen === false ? undefined : window.setTimeout(() => {
      if (overlayStack.at(-1) !== overlayId) return;
      const preferred = dialogRef.current?.querySelector<HTMLElement>(focusableSelector);
      preferred?.focus({ preventScroll: true });
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (overlayStack.at(-1) !== overlayId) return;
      if (event.key === "Escape" && !options.disabled) {
        event.preventDefault();
        event.stopImmediatePropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector))
        .filter((element) => !element.hasAttribute("disabled") && element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!dialogRef.current.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      const wasTopOverlay = overlayStack.at(-1) === overlayId;
      const overlayIndex = overlayStack.lastIndexOf(overlayId);
      if (overlayIndex >= 0) overlayStack.splice(overlayIndex, 1);
      if (focusTimer !== undefined) window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown);
      overlayLocks = Math.max(0, overlayLocks - 1);
      if (overlayLocks === 0) {
        document.body.style.overflow = previousBodyOverflow;
        document.body.style.overscrollBehavior = previousOverscrollBehavior;
      }
      if (wasTopOverlay) previousFocus?.focus({ preventScroll: true });
    };
  }, [options.active, options.disabled, options.focusOnOpen]);

  return dialogRef;
}
