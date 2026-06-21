const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const embedder = require("../utils/embedder.util");
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

class AIService {
  // --- BƯỚC 1: TÌM KIẾM KIẾN THỨC BẰNG VECTOR
  async searchKnowledge(userMessage) {
    // 1. Biến câu hỏi của khách thành mảng số
    const queryVector = await embedder.getVector(userMessage);
    const vectorString = `[${queryVector.join(",")}]`;

    // 2. So sánh với các mảng số đã lưu trong CSDL, tìm ra những câu có vector gần nhất
    const matchRules = await prisma.$queryRaw`
      SELECT rule_title, rule_content
      FROM ai_knowledge_base
      ORDER BY embedding_vector <=> ${vectorString}::vector
        LIMIT 3;
    `;
    return matchRules;
  }
  // --- BƯỚC 2: LUỒNG CHAT CHÍNH (RAG) ---
  async chatWithAI(userMessage, sessionID, mode, userId = null) {
    // 1. Quản lý Phiên Chat (Session)
    let currentSessionId = sessionID;
    if (!currentSessionId) {
      // Nếu khách chưa có session, tạo mới
      const newSession = await prisma.ai_chat_sessions.create({
        data: {
          user_id: userId, // Bắt được user_id nếu có
          session_title: userMessage.substring(0, 50) + "...", // Lấy câu đầu làm tiêu đề
        },
      });
      currentSessionId = newSession.id;
    }
    // 2. Lưu tin nhắn của Khách hàng vào DB
    await prisma.ai_chat_messages.create({
      data: {
        session_id: currentSessionId,
        sender_type: "user",
        message_text: userMessage,
      },
    });
    // 3. Tìm kiếm kiến thức (Vector Search)
    const rules = await this.searchKnowledge(userMessage);
    let contextText = "";
    if (rules.length > 0) {
      contextText = rules
        .map((r) => `-${r.rule_title}: ${r.rule_content}`)
        .join("\n");
    } else {
      contextText = "Không có thông tin cụ thể trong hệ thống.";
    }

    // 4. Tạo Prompt và gọi LLM (Groq)
    const systemPrompt = `
      Bạn là Trợ lý Tư vấn Kỹ thuật & Bán hàng chuyên nghiệp của xưởng cơ khí KPM.
      Nhiệm vụ của bạn là tư vấn, báo giá và giải đáp thắc mắc của khách hàng một cách lịch sự, thân thiện (luôn xưng "em", gọi khách là "anh/chị", dùng từ "Dạ", "ạ").

      QUY TẮC CỐT LÕI:
      [CẤM BỊA ĐẶT]: TUYỆT ĐỐI KHÔNG tự bịa ra giá cả, thông số kỹ thuật, hay thời gian bảo hành nếu không có trong dữ liệu bên dưới. Mọi thông tin phải chính xác 100% dựa trên DỮ LIỆU CỦA XƯỞNG.
      [NGOÀI PHẠM VI]: Nếu khách hỏi những câu lạc đề hoặc thông tin không có trong DỮ LIỆU CỦA XƯỞNG, hãy khéo léo từ chối bằng mẫu câu: "Dạ, vấn đề này hiện tại em chưa có thông tin chính xác, để em ghi nhận lại và nhờ kỹ thuật viên liên hệ tư vấn sâu hơn cho mình nhé ạ."
      [TRÌNH BÀY]: BẮT BUỘC phải trình bày dễ nhìn. Sử dụng gạch đầu dòng (-) cho các ý chính. Phải **in đậm** các con số, giá tiền, phần trăm chênh lệch và tên vật tư để khách dễ đọc.
      [CHỐT SALE]: TUYỆT ĐỐI BẮT BUỘC câu cuối cùng của bạn luôn phải là một CÂU HỎI MỞ liên quan đến nhu cầu của khách để duy trì cuộc hội thoại và chốt sale (Ví dụ: "Dạ nhà mình dự định làm cổng khoảng bao nhiêu mét vuông ạ?", "Anh/chị đã có bản vẽ thiết kế chưa để em bóc tách cho chuẩn ạ?").
      DỮ LIỆU CỦA XƯỞNG CUNG CẤP:
      ${contextText}
    `;

    // 5. CƠ CHẾ CHỌN MODEL (KẾT HỢP USER LỰA CHỌN & SMART ROUTING)
    let selectedModel = "llama-3.1-8b-instant"; // Khởi tạo biến

    if (mode === "fast") {
      // Khách ép dùng Nhanh
      selectedModel = "llama-3.1-8b-instant";
      console.log(`⚡ Khách hàng yêu cầu trả lời NHANH -> Chọn model 8B`);
    } else if (mode === "slow") {
      // Khách ép dùng Chậm/Sâu
      selectedModel = "llama-3.3-70b-versatile";
      console.log(`🧠 Khách hàng yêu cầu tư vấn SÂU -> Chọn model 70B`);
    } else {
      // Nếu Frontend không gửi mode (hoặc để 'auto'), hệ thống tự quyết định
      if (rules.length > 0) {
        selectedModel = "llama-3.3-70b-versatile";
        console.log(`🤖 Auto: Có luật kỹ thuật -> Chọn model 70B`);
      } else {
        selectedModel = "llama-3.1-8b-instant";
        console.log(`🤖 Auto: Câu hỏi xã giao -> Chọn model 8B`);
      }
    }

    let aiReply = "";

    // 5.5 TRUY XUẤT LỊCH SỬ CHAT (MEMORY)
    let chatHistory = await prisma.ai_chat_messages.findMany({
      where: { session_id: currentSessionId },
      orderBy: { sent_at: "desc" }, // Lấy mới nhất trước
      take: 10, // Giới hạn 10 tin nhắn gần nhất để tránh tốn Token
    });
    chatHistory = chatHistory.reverse(); // Đảo lại đúng thứ tự thời gian

    const conversationMessages = chatHistory.map((msg) => ({
      role: msg.sender_type === "ai" ? "assistant" : "user",
      content: msg.message_text,
    }));

    // 6. GỌI API & CƠ CHẾ FALLBACK (Vẫn giữ nguyên khả năng tự cứu vãn)
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationMessages,
        ],
        model: selectedModel,
        temperature: 0.2,
        max_tokens: 1024,
      });
      aiReply = chatCompletion.choices[0].message.content;
    } catch (error) {
      console.error(`❌ Mô hình ${selectedModel} gặp lỗi:`, error.message);

      // Nếu khách chọn "slow" (70B) mà bị sập, hệ thống vẫn tự lùi về 8B để cứu
      if (selectedModel === "llama-3.3-70b-versatile") {
        console.log(
          "🔄 Kích hoạt dự phòng: Lùi về llama-3.1-8b-instant để không gián đoạn...",
        );
        const fallbackCompletion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: systemPrompt },
            ...conversationMessages,
          ],
          model: "llama-3.1-8b-instant",
          temperature: 0.2,
          max_tokens: 1024,
        });
        aiReply = fallbackCompletion.choices[0].message.content;
      } else {
        aiReply =
          "Dạ hệ thống AI đang bảo trì đột xuất, anh/chị vui lòng chờ trong giây lát rồi nhắn lại nhé ạ.";
      }
    }
    // 7. Lưu câu trả lời của AI vào DB
    await prisma.ai_chat_messages.create({
      data: {
        session_id: currentSessionId,
        sender_type: "ai",
        message_text: aiReply,
      },
    });
    // 8. Trả về cho Controller
    return {
      sessionId: currentSessionId,
      reply: aiReply,
    };
  }
  // --- BƯỚC 3: AI VISION PHÂN TÍCH ẢNH BẢN VẼ (TRÍCH XUẤT JSON) ---
  async analyzeDrawing(imageUrl, messageId = null) {
    console.log(`🚀 Bắt đầu phân tích bản vẽ từ URL: ${imageUrl}`);
    // 1. Tạo System Prompt bọc thép (Ép chuẩn JSON 100%)
    const visionSystemPrompt = `
      Bạn là một kỹ sư bóc tách khối lượng cơ khí lành nghề.
      Nhiệm vụ của bạn là phân tích hình ảnh bản vẽ và BẮT BUỘC trả về kết quả dưới định dạng JSON hợp lệ (Valid JSON).
      TUYỆT ĐỐI KHÔNG thêm bất kỳ giải thích, chú thích hay văn bản nào nằm ngoài khối JSON.

      CẤU TRÚC JSON BẮT BUỘC PHẢI TUÂN THỦ NGHIÊM NGẶT NHƯ VÍ DỤ SAU:
      {
        "drawing_name": "Tên chủ thể của bản vẽ",
        "dimensions": {
          "length": 290,
          "width": null,
          "height": 340
        },
        "scale_ratio": "1:100",
        "description": "Ghi chú vật liệu hoặc cách gia công..."
      }

      QUY TẮC QUAN TRỌNG:
      - Các giá trị bên trong "dimensions" BẮT BUỘC phải là SỐ (Number) hoặc null. Không được chứa chữ cái, khoảng trắng hay đơn vị (mm/cm).
      - Nếu không thấy thông số, hãy gán giá trị là null.
      - Phải đảm bảo đóng mở ngoặc nhọn {} và dấu phẩy (,) đúng chuẩn JSON.
      - ĐỊNH VỊ TRỤC: Các thông số nằm theo trục DỌC (thẳng đứng) của bản vẽ luôn luôn là "height" (Chiều cao). Các thông số nằm theo trục NGANG luôn luôn là "length" (Chiều dài) hoặc "width" (Chiều rộng).
    `;
    try {
      //
      const response = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: visionSystemPrompt },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl, // URL ảnh công khai từ S3/Cloudinary do FE đẩy lên
                },
              },
            ],
          },
        ],
        model: "meta-llama/llama-4-scout-17b-16e-instruct", // Model chuyên dụng đọc ảnh
        response_format: { type: "json_object" }, // Ép Groq bật chế độ JSON Mode
        temperature: 0.1, // Giảm tối đa sự sáng tạo để đọc thông số chuẩn xác nhất
      });
      //
      const rawJsonString = response.choices[0].message.content;
      const extractedSpecs = JSON.parse(rawJsonString);
      console.log(
        "✅ AI đã bóc tách dữ liệu bản vẽ thành công:",
        extractedSpecs,
      );
      // 4. Lưu kết quả bóc tách vào bảng ai_drawing_analyses theo đúng schema
      const drawingAnalysis = await prisma.ai_drawing_analyses.create({
        data: {
          message_id: messageId,
          drawing_name: extractedSpecs.drawing_name || "Bản vẽ chưa rõ tên",
          image_url: imageUrl,
          specifications: extractedSpecs.dimensions, // Lưu cục Json dimensions
          scale_ratio: extractedSpecs.scale_ratio,
          // Vì schema của bro không có cột description riêng trong bảng này,
          // nên chúng ta có thể nạp luôn description vào metadata hoặc xử lý tùy FE.
        },
      });
      return drawingAnalysis;
    } catch (error) {
      console.error("❌ Lỗi khi AI Vision phân tích bản vẽ:", error.message);
      throw error;
    }
  }
}

module.exports = new AIService();
