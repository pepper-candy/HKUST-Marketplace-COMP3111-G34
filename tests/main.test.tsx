import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

describe("main entrypoint", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("document", {
      getElementById: vi.fn(() => ({ id: "root" })),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("renders App in StrictMode", async () => {
    const render = vi.fn();
    const createRoot = vi.fn(() => ({ render }));
    vi.doMock("react-dom/client", () => ({
      default: { createRoot },
      createRoot,
    }));
    vi.doMock("../src/App", () => ({
      default: () => null,
    }));

    await import("../src/main");

    expect(createRoot).toHaveBeenCalledWith({ id: "root" });
    expect(render).toHaveBeenCalledOnce();
  }, 15_000);
});
