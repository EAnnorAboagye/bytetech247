import { describe, it, expect } from "vitest";
import { isAllowedOrigin, isRateLimited } from "../../worker/index";
import type { Env } from "../../worker/index";

// Deliberately not typed against the real KVNamespace interface (from
// @cloudflare/workers-types) — that global is only ever configured for
// worker/tsconfig.json's own `tsc` run (see that file's comment on why
// it's checked separately from the rest of the project), not the root
// tsconfig `astro check` runs against, which is what actually type-checks
// this test file. A structural stand-in for just the two methods
// isRateLimited calls avoids depending on a global that may not resolve
// the same way here as it does inside worker/index.ts itself.
interface FakeKv {
  get(key: string): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ): Promise<void>;
}

// isAllowedOrigin/isRateLimited guard POST /api/counter — a public,
// unauthenticated KV write endpoint. A mistake here means either a
// legitimate same-origin request getting rejected, or the rate limit
// failing to actually bound a foreign/abusive caller.
describe("isAllowedOrigin", () => {
  it("allows a same-origin request", () => {
    const request = new Request("https://bytetech247.com/api/counter", {
      method: "POST",
      headers: { Origin: "https://bytetech247.com" },
    });
    expect(isAllowedOrigin(request)).toBe(true);
  });

  it("allows a request with no Origin header (non-browser client)", () => {
    const request = new Request("https://bytetech247.com/api/counter", {
      method: "POST",
    });
    expect(isAllowedOrigin(request)).toBe(true);
  });

  it("rejects a request from a foreign Origin", () => {
    const request = new Request("https://bytetech247.com/api/counter", {
      method: "POST",
      headers: { Origin: "https://evil.example.com" },
    });
    expect(isAllowedOrigin(request)).toBe(false);
  });
});

// Minimal in-memory stand-in for the two KV methods isRateLimited actually
// calls — a full mock of the real binding's interface isn't needed here,
// just something that behaves like it for get/put.
function createFakeKv(): FakeKv {
  const store = new Map<string, string>();
  return {
    get: async (key) => store.get(key) ?? null,
    put: async (key, value) => {
      store.set(key, value);
    },
  };
}

describe("isRateLimited", () => {
  it("allows requests under the limit", async () => {
    const env = { COUNTERS_KV: createFakeKv() } as unknown as Env;
    expect(await isRateLimited(env, "1.2.3.4")).toBe(false);
  });

  it("blocks once the same IP exceeds the per-window limit", async () => {
    const env = { COUNTERS_KV: createFakeKv() } as unknown as Env;
    let limited = false;
    for (let i = 0; i < 25; i++) {
      limited = await isRateLimited(env, "1.2.3.4");
    }
    expect(limited).toBe(true);
  });

  it("tracks different IPs independently", async () => {
    const env = { COUNTERS_KV: createFakeKv() } as unknown as Env;
    for (let i = 0; i < 20; i++) {
      await isRateLimited(env, "1.2.3.4");
    }
    expect(await isRateLimited(env, "5.6.7.8")).toBe(false);
  });
});
