import { useEffect, useState } from "react";

const SHOW_AFTER_MS = 120;
const HIDE_AFTER_MS = 90;

let inflight = 0;
let visible = false;
let showTimer: ReturnType<typeof setTimeout> | undefined;
let hideTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<(busy: boolean) => void>();

function emit(next: boolean) {
  if (visible === next) return;
  visible = next;
  document.body.classList.toggle("app-busy", next);
  document.body.setAttribute("aria-busy", next ? "true" : "false");
  listeners.forEach((listener) => listener(next));
}

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

function requestUrl(input: RequestInfo | URL) {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

function shouldTrack(input: RequestInfo | URL) {
  const url = requestUrl(input);
  if (/grant_type=refresh_token/i.test(url)) return false;
  if (/\/realtime\//i.test(url)) return false;
  return true;
}

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
