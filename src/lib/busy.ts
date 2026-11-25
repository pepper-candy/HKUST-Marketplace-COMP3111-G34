import { useEffect, useState } from "react";

const SHOW_AFTER_MS = 120;
const HIDE_AFTER_MS = 90;

let inflight = 0;
let visible = false;
let showTimer: ReturnType<typeof setTimeout> | undefined;
let hideTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<(busy: boolean) => void>();

/** Synchronizes the global busy indicator with subscribers and document state. */
function emit(next: boolean) {
  if (visible === next) return;
  visible = next;
  document.body.classList.toggle("app-busy", next);
  document.body.setAttribute("aria-busy", next ? "true" : "false");
  listeners.forEach((listener) => listener(next));
}

/** Starts tracking one request and schedules the delayed busy indication. */
function begin() {
  inflight += 1;
  if (hideTimer != null) {
    clearTimeout(hideTimer);
    hideTimer = undefined;
  }
  if (visible || showTimer != null) return;
  showTimer = setTimeout(() => {
    showTimer = undefined;
    if (inflight > 0) emit(true);
  }, SHOW_AFTER_MS);
}

/** Finishes tracking one request and schedules the delayed busy reset. */
function end() {
  inflight = Math.max(0, inflight - 1);
  if (inflight > 0) return;
  if (showTimer != null) {
    clearTimeout(showTimer);
    showTimer = undefined;
  }
  if (hideTimer != null) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    hideTimer = undefined;
    if (inflight === 0) emit(false);
  }, HIDE_AFTER_MS);
}

/** Extracts a URL string from a Fetch API request input. */
function requestUrl(input: RequestInfo | URL) {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

/** Excludes refresh-token and realtime requests from the busy indicator. */
function shouldTrack(input: RequestInfo | URL) {
  const url = requestUrl(input);
  if (/grant_type=refresh_token/i.test(url)) return false;
  if (/\/realtime\//i.test(url)) return false;
  return true;
}

/**
 * Wraps `fetch` with shared busy-state tracking for ordinary requests.
 *
 * @param input Request URL or request object passed to `fetch`.
 * @param init Optional fetch request options.
 */
export async function trackedFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  if (!shouldTrack(input)) return fetch(input, init);
  begin();
  try {
    return await fetch(input, init);
  } finally {
    end();
  }
}

/** Subscribes a component to the shared in-flight request indicator. */
export function useAppBusy() {
  const [busy, setBusy] = useState(visible);
  useEffect(() => {
    listeners.add(setBusy);
    setBusy(visible);
    return () => {
      listeners.delete(setBusy);
    };
  }, []);
  return busy;
}
