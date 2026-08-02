"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * False during SSR and the hydration pass, true afterwards.
 *
 * Uses `useSyncExternalStore` rather than a mount effect so the server and client
 * render identical markup on the first pass — no hydration mismatch, and no
 * setState-in-effect cascade.
 */
export function useIsMounted(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  );
}
