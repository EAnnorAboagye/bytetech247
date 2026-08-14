// Lemon Squeezy integration for the MCP Compatibility Checker's one-time
// payment (Merchant of Record — see the plan file's rationale: more mature
// than Stripe's newer Managed Payments product, and Lemon Squeezy is the
// legal seller of record, so bytetech247 never registers for VAT/sales tax
// itself). Two independent pieces:
//
// - createCheckout(): called from POST /api/mcp-check/start, before any
//   payment happens. Passes a self-generated opaque token through Lemon
//   Squeezy's checkout_data.custom passthrough (confirmed live,
//   docs.lemonsqueezy.com/help/checkout/passing-custom-data — echoed back
//   verbatim inside meta.custom_data on every webhook event for the
//   resulting order) so the order_created webhook can be correlated back
//   to the SESSION_KV record this token already points at.
// - verifyWebhookSignature(): HMAC-SHA256 via Web Crypto, mirroring how
//   worker/index.ts's deriveNonce() already uses crypto.subtle HMAC for the
//   CSP nonce — same primitive, different secret/purpose.
//
// The exact request/response shape below is confirmed against Lemon
// Squeezy's own documented examples (checkout_data.custom, product_options.
// redirect_url, the store/variant JSON:API relationships) as of 2026-08-14;
// the response's checkout-URL field path (data.attributes.url) could not be
// independently re-verified against a live response in this pass (their
// docs site 403'd a direct fetch) — confirm it against a real Lemon Squeezy
// test-mode response during manual verification before relying on it in
// production.

export interface LemonSqueezyConfig {
  apiKey: string;
  storeId: string;
  variantId: string;
}

export async function createCheckout(
  config: LemonSqueezyConfig,
  opts: { token: string; redirectUrl: string },
): Promise<{ checkoutUrl: string } | { error: string }> {
  let response: Response;
  try {
    response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes: {
            checkout_data: {
              custom: { token: opts.token },
            },
            product_options: {
              redirect_url: opts.redirectUrl,
            },
          },
          relationships: {
            store: { data: { type: "stores", id: config.storeId } },
            variant: { data: { type: "variants", id: config.variantId } },
          },
        },
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return { error: "Could not reach Lemon Squeezy." };
  }

  if (!response.ok) {
    return {
      error: `Lemon Squeezy checkout creation failed (${response.status}).`,
    };
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return { error: "Lemon Squeezy returned an unparseable response." };
  }

  const checkoutUrl = (body as { data?: { attributes?: { url?: unknown } } })
    ?.data?.attributes?.url;
  if (typeof checkoutUrl !== "string") {
    return {
      error: "Lemon Squeezy response did not include a checkout URL.",
    };
  }

  return { checkoutUrl };
}

// Constant-time comparison — a signature check that short-circuits on the
// first mismatched character leaks timing information an attacker can use
// to forge a valid signature byte-by-byte.
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Verifies the X-Signature header Lemon Squeezy sends on every webhook
 * request (docs.lemonsqueezy.com/help/webhooks/webhook-requests) — an
 * HMAC-SHA256 of the raw request body, hex-encoded, signed with the
 * webhook secret configured in the Lemon Squeezy dashboard. Must be called
 * with the *raw* body text, not a re-serialized JSON.parse/stringify
 * round-trip, since key ordering or whitespace differences would change
 * the hash.
 */
export async function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): Promise<boolean> {
  if (!signatureHeader) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(rawBody),
  );
  const computedHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return timingSafeEqualHex(computedHex, signatureHeader.toLowerCase());
}
