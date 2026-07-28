// skin-scan — Supabase Edge Function (Deno)
//
// Server-side proxy for the Roboflow inference API used by the free AI skin
// scan on the landing page.
//
// Why a proxy: the modal used to call Roboflow straight from the browser with
// `import.meta.env.VITE_ROBOFLOW_API_KEY`. Vite inlines VITE_* variables into the
// public bundle, so the key shipped to every visitor — and when the variables
// were not configured on Vercel the build folded the whole call site into an
// unconditional `throw new Error("Thiếu cấu hình API Key…")`, which is what broke
// the feature in production. Keeping the key in a function secret fixes both.
//
// Invoke contract:
//   POST { imageBase64 }   — raw base64, no `data:image/...;base64,` prefix
//   200  { predictions, image? }   — Roboflow's response, passed through
//
// Secrets (supabase secrets set …):
//   ROBOFLOW_MODEL_URL — e.g. https://detect.roboflow.com/<model>/<version>
//   ROBOFLOW_API_KEY   — Roboflow private API key

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Roboflow occasionally cold-starts or rate-limits; those are worth one retry.
const RETRYABLE = new Set([429, 500, 502, 503, 504]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const modelUrl = Deno.env.get("ROBOFLOW_MODEL_URL");
  const apiKey = Deno.env.get("ROBOFLOW_API_KEY");
  if (!modelUrl || !apiKey) {
    console.error("skin-scan: ROBOFLOW_MODEL_URL / ROBOFLOW_API_KEY are not set.");
    return json({ error: "Dịch vụ soi da AI chưa được cấu hình trên máy chủ." }, 500);
  }

  let imageBase64: string;
  try {
    const body = await req.json();
    imageBase64 = String(body?.imageBase64 ?? "");
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  // Strip the data-URI prefix if the caller forgot to.
  imageBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "").trim();

  if (!imageBase64) {
    return json({ error: "Thiếu dữ liệu ảnh." }, 400);
  }
  // ~8 MB of base64 ≈ 6 MB image. The client downscales before sending; this is
  // just a guard against someone posting a huge payload straight at the function.
  if (imageBase64.length > 8_000_000) {
    return json({ error: "Ảnh quá lớn, vui lòng chọn ảnh nhỏ hơn." }, 413);
  }

  const endpoint = `${modelUrl}?api_key=${encodeURIComponent(apiKey)}`;

  try {
    let res: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: imageBase64,
      });
      if (!RETRYABLE.has(res.status)) break;
      if (attempt < 2) await new Promise((r) => setTimeout(r, 600 * 2 ** attempt));
    }

    if (!res || !res.ok) {
      const detail = res ? (await res.text()).slice(0, 200) : "no response";
      console.error(`skin-scan: Roboflow responded ${res?.status}: ${detail}`);
      return json({ error: "Máy chủ phân tích ảnh đang bận, vui lòng thử lại." }, 502);
    }

    const data = await res.json();
    if (data?.error) {
      return json({ error: String(data.error) }, 502);
    }
    return json(data);
  } catch (err) {
    console.error("skin-scan: proxy error", err);
    return json({ error: (err as Error).message || "Internal Server Error" }, 500);
  }
});
