import { describe, it, expect } from "vitest";
import { isAllowedOrigin, isRateLimited } from "../../worker/index";
import type { Env } from "../../worker/index";

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

// Minimal in-memory stand-in for the two KVNamespace methods isRateLimited
// actually calls — a full mock of the real binding's interface isn't
// needed here, just something that behaves like it for get/put.
function createFakeKv(): Pick<KVNamespace, "get" | "put"> {
  const store = new Map<string, string>();
  return {
    get: (async (key: string) => store.get(key) ?? null) as KVNamespace["get"],
    put: (async (key: string, value: string) => {
      store.set(key, value);
    }) as KVNamespace["put"],
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
