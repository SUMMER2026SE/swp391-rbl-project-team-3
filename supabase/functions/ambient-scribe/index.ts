import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// AI Ambient Scribe — turns a doctor↔patient consultation transcript (raw
// Vietnamese speech-to-text output) into a structured EMR draft. The doctor
// always reviews and confirms before anything is written to the record.
const SYSTEM_INSTRUCTION = [
  'Bạn là trợ lý ghi chép y khoa (medical scribe) của phòng khám da liễu DermaSmart.',
  'Đầu vào là bản ghi thoại (speech-to-text) cuộc thăm khám giữa BÁC SĨ và BỆNH NHÂN, tiếng Việt, không phân vai, có thể chứa lỗi nhận dạng giọng nói.',
  'Nhiệm vụ: trích xuất thông tin y khoa từ hội thoại và soạn BẢN NHÁP bệnh án để bác sĩ duyệt lại.',
  '',
  'Quy tắc bắt buộc:',
  '1. CHỈ dùng thông tin xuất hiện trong hội thoại. Tuyệt đối không bịa thêm triệu chứng, tiền sử hay thuốc.',
  '2. Được phép sửa lỗi chính tả/nhận dạng giọng nói khi ngữ cảnh y khoa rõ ràng (ví dụ "viêm da cơ đỉa" → "viêm da cơ địa").',
  '3. Viết theo văn phong bệnh án: ngắn gọn, khách quan, tiếng Việt.',
  '4. Gợi ý chẩn đoán chỉ mang tính tham khảo cho bác sĩ, kèm mã ICD-10 khả dĩ (các bệnh da liễu thường thuộc chương L).',
  '5. Trường nào không có thông tin trong hội thoại thì để chuỗi rỗng "" hoặc mảng rỗng [].',
  '',
  'Trả về DUY NHẤT một JSON object theo đúng schema sau, không kèm markdown hay giải thích:',
  '{',
  '  "summary": "tóm tắt 1-2 câu về buổi khám",',
  '  "symptoms": "triệu chứng lâm sàng & lý do khám (bệnh nhân mô tả + bác sĩ quan sát)",',
  '  "medical_history": "tiền sử bệnh, dị ứng, thuốc đang dùng nếu được nhắc tới",',
  '  "assessment": "đánh giá tình trạng của bác sĩ",',
  '  "diagnosis_suggestions": [{ "name": "tên bệnh tiếng Việt", "icd10_hint": "mã ICD-10, ví dụ L20.9" }],',
  '  "treatment_direction": "hướng điều trị bác sĩ đã trao đổi",',
  '  "medication_suggestions": [{ "name": "tên thuốc", "dosage": "liều dùng", "frequency": "tần suất", "instructions": "cách dùng" }],',
  '  "follow_up": "hẹn tái khám / dặn dò nếu có"',
  '}',
].join('\n');

function extractJson(text: string): Record<string, unknown> | null {
  if (!text) return null;
  // Strip ```json fences if the model added them despite instructions.
  const cleaned = text.replace(/```json|```/gi, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (_) {
    // Last resort: grab the outermost object literal.
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch (_) {
        return null;
      }
    }
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('CHATBOT_API_KEY');
    if (!apiKey) {
      console.error('CHATBOT_API_KEY is not set in Deno environment.');
      return new Response(
        JSON.stringify({ error: 'Missing API Key Configuration on Server' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { transcript, patientName } = await req.json();

    if (!transcript || typeof transcript !== 'string' || transcript.trim().length < 20) {
      return new Response(
        JSON.stringify({ error: 'Transcript quá ngắn để phân tích.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    const prompt = [
      patientName ? `Bệnh nhân: ${patientName}` : '',
      'Bản ghi thoại buổi khám:',
      '---',
      transcript.slice(0, 30000),
      '---',
      'Hãy trích xuất và trả về JSON bản nháp bệnh án.',
    ].filter(Boolean).join('\n');

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
    });

    const text = result?.response?.text?.() || '';
    const draft = extractJson(text);

    if (!draft) {
      console.error('ambient-scribe: model returned unparseable output:', text.slice(0, 500));
      return new Response(
        JSON.stringify({ error: 'AI không trả về dữ liệu hợp lệ, vui lòng thử lại.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ draft }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ambient-scribe edge function:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
