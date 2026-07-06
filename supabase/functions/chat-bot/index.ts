import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  // 1. Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2. Retrieve the API key securely
    const apiKey = Deno.env.get('CHATBOT_API_KEY');
    if (!apiKey) {
      console.error('CHATBOT_API_KEY is not set in Deno environment.');
      return new Response(
        JSON.stringify({ error: 'Missing API Key Configuration on Server' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Parse the JSON request body safely
    const { message, history } = await req.json();

    // 4. Initialize Gemini SDK
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: [
        'Bạn là trợ lý AI ảo của phòng khám da liễu DermaSmart. Tên bạn là DermaBot.',
        'Nhiệm vụ: Tư vấn dịch vụ, giải đáp thắc mắc một cách nhẹ nhàng, lịch sự, ngắn gọn và thân thiện. Luôn trả lời bằng tiếng Việt.',
        'Quy tắc an toàn: KHÔNG tự ý chẩn đoán bệnh nặng và KHÔNG kê đơn thuốc. ' +
          'Nếu bệnh nhân có triệu chứng nghiêm trọng, cần tư vấn chuyên sâu, hoặc yêu cầu gặp người thật, ' +
          'hãy khuyên họ đặt lịch khám, hoặc nói chính xác câu: "Tôi sẽ kết nối bạn với Lễ tân ngay bây giờ".',
      ].join('\n'),
    });

    // 5. Setup chat and call AI SDK
    const chat = model.startChat({
      history: history || [],
      generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
    });

    const result = await chat.sendMessage(message);
    const text = result?.response?.text?.() || '';

    // 6. Return response
    return new Response(
      JSON.stringify({ text: text.trim() }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in chat-bot edge function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
