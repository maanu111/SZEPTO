"use client";

import Image from "next/image";
import { useCallback, useState, useSyncExternalStore } from "react";
import { CloseIcon } from "./icons";

/**
 * "Install the app", shown until it is installed or explicitly declined.
 *
 * The rule the store asked for: keep offering it every visit until the customer
 * either installs it or says no. So the dismissal is remembered — a prompt that
 * reappears after being refused is a nuisance, not persistence — while simply
 * ignoring it leaves the offer standing next time.
 *
 * iOS has no install event at all; Safari only offers Add to Home Screen from
 * its share menu, so there the button explains where to find it.
 */

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISSED_KEY = "szepto.install-dismissed.v1";

/* ---- installed-state store, shared by every subscriber ---- */

let deferred: InstallEvent | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function subscribe(listener: () => void) {
  listeners.add(listener);

  const onBeforeInstall = (e: Event) => {
    // Keep the event so the button can trigger the real prompt later.
    e.preventDefault();
    deferred = e as InstallEvent;
    emit();
  };
  const onInstalled = () => {
    deferred = null;
    emit();
  };

  window.addEventListener("beforeinstallprompt", onBeforeInstall);
  window.addEventListener("appinstalled", onInstalled);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("beforeinstallprompt", onBeforeInstall);
    window.removeEventListener("appinstalled", onInstalled);
  };
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari's own flag, which predates display-mode.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    // iPadOS reports as a Mac, but a touch-capable one.
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/*
 * Environment facts — installed, iOS, previously declined.
 *
 * These are browser-only, so they are read through an external store rather
 * than assigned in an effect: the server snapshot hides the prompt, the client
 * snapshot tells the truth, and there is no extra render pass in between.
 * The snapshot object is cached because getSnapshot must be referentially
 * stable or React re-renders forever.
 */
const FACTS_EVENT = "szepto:install-facts";

type Facts = { installed: boolean; ios: boolean; dismissed: boolean };

let factsCache: Facts | null = null;
const SERVER_FACTS: Facts = { installed: true, ios: false, dismissed: true };

function readFacts(): Facts {
  let dismissed = false;
  try {
    dismissed = window.localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    /* storage blocked — the offer simply returns next visit */
  }
  return { installed: isStandalone(), ios: isIOS(), dismissed };
}

function subscribeFacts(listener: () => void) {
  const invalidate = () => {
    factsCache = null;
    listener();
  };
  window.addEventListener(FACTS_EVENT, invalidate);
  window.addEventListener("appinstalled", invalidate);
  const media = window.matchMedia?.("(display-mode: standalone)");
  media?.addEventListener?.("change", invalidate);
  return () => {
    window.removeEventListener(FACTS_EVENT, invalidate);
    window.removeEventListener("appinstalled", invalidate);
    media?.removeEventListener?.("change", invalidate);
  };
}

export function InstallPrompt() {
  const canPrompt = useSyncExternalStore(
    subscribe,
    () => deferred !== null,
    () => false
  );

  const { installed, ios, dismissed } = useSyncExternalStore(
    subscribeFacts,
    () => (factsCache ??= readFacts()),
    () => SERVER_FACTS
  );

  const [showIOSHelp, setShowIOSHelp] = useState(false);

  const decline = useCallback(() => {
    try {
      window.localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      /* the offer will simply return next visit */
    }
    window.dispatchEvent(new Event(FACTS_EVENT));
  }, []);

  const install = useCallback(async () => {
    if (ios) {
      setShowIOSHelp(true);
      return;
    }
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    deferred = null;
    emit();
    // Declining the browser's own dialog counts as saying no.
    if (outcome === "dismissed") decline();
  }, [ios, decline]);

  if (installed || dismissed) return null;
  // Nothing to offer: not iOS, and the browser never said it was installable.
  if (!canPrompt && !ios) return null;

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-[60] px-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] sm:left-auto sm:right-4 sm:w-80 sm:px-0 sm:pb-4">
        <div className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white p-3 shadow-[0_10px_40px_rgba(0,0,0,0.15)]">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-ink-100">
            <Image
              src="/icons/icon-192.png"
              alt=""
              width={192}
              height={192}
              className="h-full w-full object-contain"
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-extrabold text-ink-900">Install Kiranaclick</span>
            <span className="block truncate text-[11px] text-ink-500">
              Faster ordering, works offline
            </span>
          </span>
          <button
            type="button"
            onClick={install}
            className="h-9 shrink-0 rounded-xl bg-accent-500 px-3.5 text-xs font-bold text-white transition-colors hover:bg-accent-600"
          >
            Install
          </button>
          <button
            type="button"
            onClick={decline}
            aria-label="Not now"
            className="shrink-0 text-ink-400 transition-colors hover:text-ink-700"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showIOSHelp && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-4 sm:items-center"
          onClick={() => setShowIOSHelp(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-extrabold text-ink-900">Add Kiranaclick to your Home Screen</h2>
            <ol className="mt-3 flex flex-col gap-2.5 text-[13px] text-ink-600">
              <li className="flex gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-100 text-[11px] font-bold text-ink-700">
                  1
                </span>
                Tap the Share button at the bottom of Safari
              </li>
              <li className="flex gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-100 text-[11px] font-bold text-ink-700">
                  2
                </span>
                Scroll down and choose &ldquo;Add to Home Screen&rdquo;
              </li>
              <li className="flex gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-100 text-[11px] font-bold text-ink-700">
                  3
                </span>
                Tap Add
              </li>
            </ol>
            <button
              type="button"
              onClick={() => setShowIOSHelp(false)}
              className="mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-ink-900 text-sm font-bold text-white"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
