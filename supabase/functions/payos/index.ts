// payos — Supabase Edge Function (Deno)
//
// Server-side proxy for the PayOS merchant API so the CLIENT_ID / API_KEY /
// CHECKSUM_KEY never ship in the browser bundle (they used to be hardcoded in
// src/utils/payos.js). The checksum signature is computed here, server-side.
//
// Invoke contract (via `supabase.functions.invoke('payos', { body })`):
//   POST { action: 'create', orderCode, amount, description, returnUrl, cancelUrl }
//     → PayOS payment-request data (bin, accountNumber, amount, description,
//       accountName, checkoutUrl, qrCode, paymentLinkId, ...)
//   POST { action: 'status', orderCode }
//     → PayOS payment-request data (status: 'PENDING' | 'PAID' | ...)
//
// Secrets (set via `supabase secrets set`):
//   PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY — all required.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PAYOS_BASE = "https://api-merchant.payos.vn";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// PayOS checksum: HMAC-SHA256 over "k=v&k=v..." with keys sorted alphabetically.
async function signPayload(
  data: Record<string, unknown>,
  checksumKey: string,
): Promise<string> {
  const dataString = Object.keys(data)
    .sort()
    .filter((k) => data[k] !== undefined && data[k] !== null)
    .map((k) => `${k}=${data[k]}`)
    .join("&");

  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(checksumKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    encoder.encode(dataString),
  );
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const clientId = Deno.env.get("PAYOS_CLIENT_ID");
  const apiKey = Deno.env.get("PAYOS_API_KEY");
  const checksumKey = Deno.env.get("PAYOS_CHECKSUM_KEY");
  if (!clientId || !apiKey || !checksumKey) {
    return json({ error: "PayOS secrets are not configured" }, 500);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const authHeaders = {
    "Content-Type": "application/json",
    "x-client-id": clientId,
    "x-api-key": apiKey,
  };

  try {
    if (body.action === "create") {
      const orderCode = Number(body.orderCode);
      const amount = Number(body.amount);
      if (!Number.isFinite(orderCode) || !Number.isFinite(amount) || amount <= 0) {
        return json({ error: "orderCode and a positive amount are required" }, 400);
      }
      const payload = {
        orderCode,
        amount,
        description: String(body.description ?? "").substring(0, 25),
        returnUrl: String(body.returnUrl ?? ""),
        cancelUrl: String(body.cancelUrl ?? ""),
      };
      const signature = await signPayload(payload, checksumKey);
      const res = await fetch(`${PAYOS_BASE}/v2/payment-requests`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ ...payload, signature }),
      });
      const out = await res.json();
      if (out.code !== "00") {
        return json({ error: out.desc || "Failed to create payment link" }, 502);
      }
      return json({ data: out.data });
    }

    if (body.action === "status") {
      const orderCode = Number(body.orderCode);
      if (!Number.isFinite(orderCode)) {
        return json({ error: "orderCode is required" }, 400);
      }
      const res = await fetch(`${PAYOS_BASE}/v2/payment-requests/${orderCode}`, {
        method: "GET",
        headers: authHeaders,
      });
      const out = await res.json();
      if (out.code !== "00") {
        return json({ error: out.desc || "Failed to get payment status" }, 502);
      }
      return json({ data: out.data });
    }

    return json({ error: "Unknown action (expected 'create' or 'status')" }, 400);
  } catch (err) {
    return json({ error: (err as Error).message || "PayOS proxy error" }, 500);
  }
});
