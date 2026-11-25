import { afterEach, describe, expect, test, vi } from "vitest";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.resetModules();
  vi.unstubAllGlobals();
});

describe("trackedFetch", () => {
  test("does not track realtime and refresh-token requests", async () => {
    const classList = { toggle: vi.fn(), remove: vi.fn() };
    vi.stubGlobal("document", {
      body: {
        classList,
        setAttribute: vi.fn(),
        removeAttribute: vi.fn(),
      },
    });
    vi.resetModules();
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => new Response(String(input)));
    vi.stubGlobal("fetch", fetchMock);
    const { trackedFetch } = await import("../src/lib/busy");

    await trackedFetch("https://example.com/auth/v1/token?grant_type=refresh_token");
    await trackedFetch("https://example.com/realtime/v1");

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test("tracks regular fetch requests and clears busy state after completion", async () => {
    vi.stubGlobal("document", {
      body: {
        classList: { toggle: vi.fn(), remove: vi.fn() },
        setAttribute: vi.fn(),
        removeAttribute: vi.fn(),
      },
    });
    vi.resetModules();
    vi.useFakeTimers();
    const fetchMock = vi.fn(async () => new Response("ok"));
    vi.stubGlobal("fetch", fetchMock);
    const { trackedFetch } = await import("../src/lib/busy");

    const promise = trackedFetch("https://example.com/api");
    await promise;
    await vi.advanceTimersByTimeAsync(120);
    await vi.advanceTimersByTimeAsync(90);

    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
