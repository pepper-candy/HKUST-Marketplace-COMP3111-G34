import { describe, expect, test } from "vitest";
import { supabase } from "../src/lib/supabase";

describe("supabase client", () => {
  test("exports a configured Supabase client", () => {
    expect(supabase).toBeDefined();
    expect(typeof supabase.from).toBe("function");
    expect(typeof supabase.auth.getSession).toBe("function");
  });
});
