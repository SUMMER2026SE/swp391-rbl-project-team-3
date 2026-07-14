// send-clinic-email — Supabase Edge Function (Deno)
//
// Transactional email gateway for DermaSmart. Receives a typed payload from the
// frontend (via `supabase.functions.invoke`), renders an elegant Vietnamese
// HTML template, and dispatches it through the Resend API.
//
// Invoke contract:
//   POST { type, patientEmail, patientName, payload }
//     type        : 'appointment' | 'invoice'
//     patientEmail : string  (recipient)
//     patientName  : string  (greeting)
//     payload      : object  (template-specific fields, see builders below)
//
// Secrets (set via `supabase secrets set`):
//   RESEND_API_KEY — required.

import "@supabase/functions-js/edge-runtime.d.ts";

// ---------------------------------------------------------------------------
// CORS — required so the browser preflight (OPTIONS) succeeds before invoke().
// ---------------------------------------------------------------------------
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ---------------------------------------------------------------------------
// Brand tokens — kept in one place so both templates stay visually consistent.
// ---------------------------------------------------------------------------
const BRAND = {
  name: "DermaSmart",
  tagline: "Phòng khám Da liễu Thẩm mỹ",
  primary: "#0f766e", // deep teal
  primarySoft: "#ccfbf1",
  ink: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
  bg: "#f1f5f9",
  surface: "#ffffff",
};

// Small helpers ------------------------------------------------------------
const esc = (v: unknown): string =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const formatVND = (n: unknown): string => {
  const num = Number(n);
  if (!Number.isFinite(num)) return esc(n);
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(num);
};

// Shared email chrome (header + footer) wrapping a template's inner body.
function shell(title: string, inner: string): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BRAND.ink};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(title)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:92%;background:${BRAND.surface};border-radius:18px;overflow:hidden;box-shadow:0 10px 40px rgba(15,23,42,.08);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,${BRAND.primary},#0d9488);padding:28px 36px;">
          <table role="presentation" width="100%"><tr>
            <td style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:.3px;">✦ ${BRAND.name}</td>
            <td align="right" style="color:${BRAND.primarySoft};font-size:12px;">${BRAND.tagline}</td>
          </tr></table>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:36px;">${inner}</td></tr>
        <!-- Footer -->
        <tr><td style="padding:24px 36px;background:#f8fafc;border-top:1px solid ${BRAND.border};">
          <p style="margin:0;color:${BRAND.muted};font-size:12px;line-height:1.6;">
            Email được gửi tự động từ hệ thống ${BRAND.name}. Vui lòng không trả lời email này.<br/>
            Cần hỗ trợ? Liên hệ tổng đài <strong style="color:${BRAND.ink};">1900 1234</strong> hoặc đặt lịch trực tuyến tại website của chúng tôi.
          </p>
          <p style="margin:12px 0 0;color:#94a3b8;font-size:11px;">© ${new Date().getFullYear()} ${BRAND.name}. Đã đăng ký bản quyền.</p>
        </td></tr>
      </table>
      <p style="color:#94a3b8;font-size:11px;margin:18px 0 0;">Bạn nhận được email này vì đã sử dụng dịch vụ tại ${BRAND.name}.</p>
    </td></tr>
  </table>
</body>
</html>`;
}

// A labelled detail row used inside info cards.
function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 0;color:${BRAND.muted};font-size:14px;width:42%;vertical-align:top;">${esc(label)}</td>
    <td style="padding:10px 0;color:${BRAND.ink};font-size:14px;font-weight:600;text-align:right;">${value}</td>
  </tr>`;
}

const greeting = (name: string) =>
  `<p style="margin:0 0 6px;font-size:16px;">Kính chào <strong>${esc(name) || "Quý khách"}</strong>,</p>`;

// ---------------------------------------------------------------------------
// Template: APPOINTMENT confirmation
//   payload: { service, doctorName, date, time, location, note, status }
// ---------------------------------------------------------------------------
function buildAppointmentEmail(name: string, p: Record<string, unknown> = {}) {
  const subject = `Xác nhận lịch hẹn tại ${BRAND.name}`;
  const rows = [
    p.service ? detailRow("Dịch vụ", esc(p.service)) : "",
    p.doctorName ? detailRow("Bác sĩ phụ trách", esc(p.doctorName)) : "",
    p.date ? detailRow("Ngày khám", esc(p.date)) : "",
    p.time ? detailRow("Giờ khám", esc(p.time)) : "",
    p.location ? detailRow("Địa điểm", esc(p.location)) : "",
    p.status ? detailRow("Trạng thái", esc(p.status)) : "",
  ].join("");

  const inner = `
    ${greeting(name)}
    <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:${BRAND.muted};">
      Cảm ơn Quý khách đã tin tưởng lựa chọn ${BRAND.name}. Lịch hẹn của Quý khách đã được ghi nhận với thông tin chi tiết dưới đây:
    </p>
    <table role="presentation" width="100%" style="background:${BRAND.primarySoft}1a;border:1px solid ${BRAND.border};border-radius:14px;padding:8px 22px;margin-bottom:24px;">
      ${rows}
    </table>
    ${p.note ? `<p style="margin:0 0 24px;padding:14px 18px;background:#fffbeb;border-left:3px solid #f59e0b;border-radius:8px;font-size:14px;color:#92400e;">📌 ${esc(p.note)}</p>` : ""}
    <p style="margin:0 0 8px;font-size:14px;line-height:1.7;color:${BRAND.muted};">
      Vui lòng đến trước giờ hẹn <strong>10–15 phút</strong> để hoàn tất thủ tục. Nếu cần thay đổi, xin liên hệ tổng đài trước ít nhất 24 giờ.
    </p>
    <p style="margin:24px 0 0;font-size:15px;">Trân trọng,<br/><strong style="color:${BRAND.primary};">Đội ngũ ${BRAND.name}</strong></p>
  `;
  return { subject, html: shell(subject, inner) };
}

// ---------------------------------------------------------------------------
// Template: INVOICE
//   payload: { invoiceNo, date, items[{name,qty,price}], total, paymentMethod, status }
// ---------------------------------------------------------------------------
function buildInvoiceEmail(name: string, p: Record<string, unknown> = {}) {
  const subject = `Hóa đơn dịch vụ ${p.invoiceNo ? `#${esc(p.invoiceNo)}` : ""} — ${BRAND.name}`.trim();

  const items = Array.isArray(p.items) ? p.items : [];
  const itemRows = items
    .map((it: Record<string, unknown>) => {
      const qty = Number(it?.qty ?? 1) || 1;
      const price = Number(it?.price ?? 0) || 0;
      return `<tr>
        <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border};font-size:14px;color:${BRAND.ink};">${esc(it?.name)}</td>
        <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border};font-size:14px;color:${BRAND.muted};text-align:center;">${qty}</td>
        <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border};font-size:14px;color:${BRAND.ink};text-align:right;">${formatVND(price * qty)}</td>
      </tr>`;
    })
    .join("");

  const meta = [
    p.invoiceNo ? detailRow("Mã hóa đơn", esc(p.invoiceNo)) : "",
    p.date ? detailRow("Ngày lập", esc(p.date)) : "",
    p.paymentMethod ? detailRow("Hình thức thanh toán", esc(p.paymentMethod)) : "",
    p.status ? detailRow("Trạng thái", esc(p.status)) : "",
  ].join("");

  const inner = `
    ${greeting(name)}
    <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:${BRAND.muted};">
      ${BRAND.name} xin gửi đến Quý khách hóa đơn cho các dịch vụ đã sử dụng. Chi tiết như sau:
    </p>
    ${meta ? `<table role="presentation" width="100%" style="margin-bottom:20px;">${meta}</table>` : ""}
    ${
      itemRows
        ? `<table role="presentation" width="100%" style="margin-bottom:8px;">
            <tr>
              <th align="left" style="padding:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:.5px;color:${BRAND.muted};border-bottom:2px solid ${BRAND.primary};">Dịch vụ</th>
              <th align="center" style="padding:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:.5px;color:${BRAND.muted};border-bottom:2px solid ${BRAND.primary};">SL</th>
              <th align="right" style="padding:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:.5px;color:${BRAND.muted};border-bottom:2px solid ${BRAND.primary};">Thành tiền</th>
            </tr>
            ${itemRows}
          </table>`
        : ""
    }
    <table role="presentation" width="100%" style="margin-top:16px;">
      <tr>
        <td style="font-size:16px;font-weight:700;color:${BRAND.ink};">Tổng cộng</td>
        <td align="right" style="font-size:20px;font-weight:800;color:${BRAND.primary};">${formatVND(p.total)}</td>
      </tr>
    </table>
    <p style="margin:24px 0 0;font-size:14px;line-height:1.7;color:${BRAND.muted};">
      Cảm ơn Quý khách đã sử dụng dịch vụ tại ${BRAND.name}. Hóa đơn này là chứng từ xác nhận giao dịch của Quý khách.
    </p>
    <p style="margin:24px 0 0;font-size:15px;">Trân trọng,<br/><strong style="color:${BRAND.primary};">Phòng Kế toán — ${BRAND.name}</strong></p>
  `;
  return { subject, html: shell(subject, inner) };
}

// ---------------------------------------------------------------------------
// Template: REEXAMINATION confirmation
//   payload: { doctorName, date, time, reason, location, status }
// ---------------------------------------------------------------------------
function buildReexaminationEmail(name: string, p: Record<string, unknown> = {}) {
  const subject = `Thông báo lịch tái khám định kỳ — ${BRAND.name}`;
  const rows = [
    p.doctorName ? detailRow("Bác sĩ hẹn khám", esc(p.doctorName)) : "",
    p.date ? detailRow("Ngày tái khám", esc(p.date)) : "",
    p.time ? detailRow("Giờ tái khám", esc(p.time)) : "",
    p.reason ? detailRow("Lý do tái khám", esc(p.reason)) : "",
    p.location ? detailRow("Địa điểm", esc(p.location)) : "",
    p.status ? detailRow("Trạng thái", esc(p.status)) : "",
  ].join("");

  const inner = `
    ${greeting(name)}
    <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:${BRAND.muted};">
      Theo chỉ định từ bác sĩ phụ trách tại ${BRAND.name}, Quý khách có lịch tái khám định kỳ để theo dõi và đánh giá tiến trình điều trị da. Thông tin lịch hẹn chi tiết như sau:
    </p>
    <table role="presentation" width="100%" style="background:${BRAND.primarySoft}1a;border:1px solid ${BRAND.border};border-radius:14px;padding:8px 22px;margin-bottom:24px;">
      ${rows}
    </table>
    <p style="margin:0 0 8px;font-size:14px;line-height:1.7;color:${BRAND.muted};">
      📌 <strong>Lưu ý:</strong> Vui lòng mang theo đơn thuốc và hồ sơ bệnh án cũ (nếu có). Đến trước giờ hẹn <strong>10–15 phút</strong> để bác sĩ chuẩn bị chu đáo nhất cho buổi tái khám của bạn.
    </p>
    <p style="margin:24px 0 0;font-size:15px;">Trân trọng,<br/><strong style="color:${BRAND.primary};">Đội ngũ y tế ${BRAND.name}</strong></p>
  `;
  return { subject, html: shell(subject, inner) };
}

// ---------------------------------------------------------------------------
// Template: MEDICAL RECORD & PRESCRIPTION
//   payload: { diagnosis, symptoms, doctorNotes, medications:[{name,dosage,frequency,instructions,quantity}], followUpDate }
// ---------------------------------------------------------------------------
function buildMedicalRecordEmail(name: string, p: Record<string, unknown> = {}) {
  const subject = `Hồ sơ khám bệnh & Đơn thuốc điện tử — ${BRAND.name}`;
  
  const meds = Array.isArray(p.medications) ? p.medications : [];
  const medRows = meds
    .map((m: Record<string, unknown>, idx: number) => {
      const q = m.quantity ? ` (SL: ${esc(m.quantity)})` : "";
      const details = [
        m.dosage ? `Liều lượng: ${esc(m.dosage)}` : "",
        m.frequency ? `Tần suất: ${esc(m.frequency)}` : "",
        m.instructions ? `Cách dùng: ${esc(m.instructions || m.instruction)}` : ""
      ].filter(Boolean).join(" | ");
      
      return `<tr>
        <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border};font-size:14px;vertical-align:top;">
          <div style="font-weight:750;color:${BRAND.ink};">${idx + 1}. ${esc(m.name || m.medicineName || m.medicine_name || '')}${q}</div>
          ${details ? `<div style="font-size:12px;color:${BRAND.muted};margin-top:4px;">${details}</div>` : ""}
        </td>
      </tr>`;
    })
    .join("");

  const rows = [
    p.symptoms ? detailRow("Triệu chứng lâm sàng", esc(p.symptoms)) : "",
    p.diagnosis ? detailRow("Chẩn đoán bệnh lý", esc(p.diagnosis)) : "",
    p.followUpDate ? detailRow("Ngày tái khám (dự kiến)", esc(p.followUpDate)) : "",
  ].join("");

  const inner = `
    ${greeting(name)}
    <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:${BRAND.muted};">
      ${BRAND.name} xin gửi đến Quý khách tóm tắt hồ sơ khám bệnh và đơn thuốc chỉ định từ bác sĩ sau buổi khám da liễu:
    </p>
    
    <h4 style="margin:24px 0 12px;font-size:15px;color:${BRAND.primary};text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid ${BRAND.primary};padding-bottom:6px;">Kết quả khám bệnh</h4>
    ${rows ? `<table role="presentation" width="100%" style="margin-bottom:20px;">${rows}</table>` : ""}
    
    ${p.doctorNotes ? `
    <div style="margin:0 0 24px;padding:14px 18px;background:#f0fdfa;border-left:3px solid ${BRAND.primary};border-radius:8px;font-size:14px;color:${BRAND.ink};">
      <strong>📌 Lời dặn từ Bác sĩ:</strong><br/>
      <span style="display:inline-block;margin-top:6px;line-height:1.6;color:${BRAND.muted};">${esc(p.doctorNotes)}</span>
    </div>` : ""}
    
    ${medRows ? `
      <h4 style="margin:24px 0 12px;font-size:15px;color:${BRAND.primary};text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid ${BRAND.primary};padding-bottom:6px;">Đơn thuốc chỉ định</h4>
      <table role="presentation" width="100%" style="margin-bottom:24px;border-collapse:collapse;">
        ${medRows}
      </table>
    ` : ""}

    <p style="margin:24px 0 0;font-size:14px;line-height:1.7;color:${BRAND.muted};">
      Vui lòng tuân thủ đúng liều lượng và cách dùng thuốc theo chỉ định của bác sĩ. Nếu xuất hiện bất kỳ dấu hiệu bất thường nào khi dùng thuốc, xin vui lòng ngừng thuốc và liên hệ với hotline phòng khám hoặc đến cơ sở y tế gần nhất.
    </p>
    <p style="margin:24px 0 0;font-size:15px;">Trân trọng,<br/><strong style="color:${BRAND.primary};">Đội ngũ y tế ${BRAND.name}</strong></p>
  `;
  return { subject, html: shell(subject, inner) };
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
Deno.serve(async (req) => {
  // 1) CORS preflight — must short-circuit before any work.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("[send-clinic-email] RESEND_API_KEY secret is not set.");
      return json({ error: "Email service is not configured." }, 500);
    }

    // Sender identity. Overridable so verifying a domain in Resend is a secret
    // change (`supabase secrets set EMAIL_FROM=...`), not a code change.
    const EMAIL_FROM = Deno.env.get("EMAIL_FROM") ??
      "DermaSmart <onboarding@resend.dev>";

    const { type, patientEmail, patientName, payload } = await req.json();

    if (!type || !patientEmail) {
      return json({ error: "Missing required fields: 'type' and 'patientEmail'." }, 400);
    }

    // 2) Render the template for the requested type.
    let built: { subject: string; html: string };
    switch (type) {
      case "appointment":
        built = buildAppointmentEmail(patientName, payload ?? {});
        break;
      case "invoice":
        built = buildInvoiceEmail(patientName, payload ?? {});
        break;
      case "reexamination":
        built = buildReexaminationEmail(patientName, payload ?? {});
        break;
      case "medical_record":
        built = buildMedicalRecordEmail(patientName, payload ?? {});
        break;
      default:
        return json({ error: `Unsupported email type: '${type}'.` }, 400);
    }

    // 3) Dispatch via Resend.
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Verified sender. Falls back to Resend's shared testing address, which
        // ONLY delivers to the Resend account owner's own inbox — set the
        // EMAIL_FROM secret to an address on a domain you verified in Resend to
        // actually reach patients.
        from: EMAIL_FROM,
        to: [patientEmail],
        subject: built.subject,
        html: built.html,
      }),
    });

    const result = await resendRes.json();

    if (!resendRes.ok) {
      console.error("[send-clinic-email] Resend rejected the request:", result);

      // Resend's sandbox rejection is by far the most common failure here, and its
      // raw JSON is meaningless to a receptionist. Name the actual problem.
      const isSandboxBlock =
        resendRes.status === 403 &&
        /testing emails|own email address|verify a domain/i.test(
          String(result?.message ?? ""),
        );

      return json(
        {
          error: isSandboxBlock
            ? "Hệ thống email đang ở chế độ thử nghiệm nên chỉ gửi được tới email chủ tài khoản Resend. Cần xác minh domain trên Resend và đặt secret EMAIL_FROM để gửi cho bệnh nhân."
            : `Không gửi được email: ${result?.message ?? "lỗi không xác định từ nhà cung cấp."}`,
          code: isSandboxBlock ? "RESEND_SANDBOX" : "RESEND_ERROR",
          details: result,
        },
        resendRes.status,
      );
    }

    console.log(`[send-clinic-email] Sent '${type}' email to ${patientEmail} (id: ${result?.id}).`);
    // 4) Return the Resend response.
    return json({ success: true, id: result?.id, data: result });
  } catch (err) {
    console.error("[send-clinic-email] Unhandled error:", err);
    return json({ error: (err as Error)?.message ?? "Unexpected error." }, 500);
  }
});
