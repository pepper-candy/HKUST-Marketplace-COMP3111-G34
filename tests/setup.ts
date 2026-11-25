import { vi } from "vitest";

vi.stubEnv("VITE_SUPABASE_URL", "https://unit-test.invalid");
vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "unit-test-publishable-key");
