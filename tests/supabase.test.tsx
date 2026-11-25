import { describe, expect, test } from "vitest";
import { supabase } from "../src/lib/supabase";

describe("supabase client", () => {
  test("uses the isolated test endpoint and exports a configured client", () => {
    expect(import.meta.env.VITE_SUPABASE_URL).toBe("https://unit-test.invalid");
    expect(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY).toBe("unit-test-publishable-key");
    expect(supabase).toBeDefined();
    expect(typeof supabase.from).toBe("function");
    expect(typeof supabase.auth.getSession).toBe("function");
  });
});
