import { afterEach, describe, expect, test, vi } from "vitest";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("trackedFetch", () => {
  function stubDocument() {
    const body = {
      classList: { toggle: vi.fn(), remove: vi.fn() },
      setAttribute: vi.fn(),
      removeAttribute: vi.fn(),
    };
    vi.stubGlobal("document", { body });
    return body;
  }

  test("does not track realtime and refresh-token requests", async () => {
    stubDocument();
    vi.resetModules();
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => new Response(String(input)));
    vi.stubGlobal("fetch", fetchMock);
    const { trackedFetch } = await import("../src/lib/busy");

    await trackedFetch("https://example.com/auth/v1/token?grant_type=refresh_token");
    await trackedFetch("https://example.com/realtime/v1");
    await trackedFetch(new URL("https://example.com/realtime/channel"));
    await trackedFetch(new Request("https://example.com/api"));

    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  test("tracks regular fetch requests and clears busy state after completion", async () => {
    const body = stubDocument();
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
    expect(body.classList.toggle).not.toHaveBeenCalled();
    expect(body.setAttribute).not.toHaveBeenCalled();
  });

  test("keeps the busy indicator visible until all overlapping requests finish", async () => {
    const body = stubDocument();
    vi.resetModules();
    vi.useFakeTimers();
    const resolvers: Array<(response: Response) => void> = [];
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolvers.push(resolve);
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const { trackedFetch } = await import("../src/lib/busy");

    const first = trackedFetch("https://example.com/first");
    const second = trackedFetch("https://example.com/second");
    await vi.advanceTimersByTimeAsync(120);
    expect(body.classList.toggle).toHaveBeenCalledWith("app-busy", true);
    expect(body.setAttribute).toHaveBeenCalledWith("aria-busy", "true");

    resolvers[0](new Response("first"));
    await first;
    resolvers[1](new Response("second"));
    await second;
    const third = trackedFetch("https://example.com/third");
    resolvers[2](new Response("third"));
    await third;
    await vi.advanceTimersByTimeAsync(90);

    expect(body.classList.toggle).toHaveBeenLastCalledWith("app-busy", false);
    expect(body.setAttribute).toHaveBeenLastCalledWith("aria-busy", "false");
  });

  test("ends tracking after fetch rejects", async () => {
    const body = stubDocument();
    vi.resetModules();
    vi.useFakeTimers();
    const fetchMock = vi.fn(async () => {
      throw new Error("network failed");
    });
    vi.stubGlobal("fetch", fetchMock);
    const { trackedFetch } = await import("../src/lib/busy");

    await expect(trackedFetch("https://example.com/failure")).rejects.toThrow("network failed");
    await vi.advanceTimersByTimeAsync(120);
    await vi.advanceTimersByTimeAsync(90);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(body.classList.toggle).not.toHaveBeenCalled();
  });
});
