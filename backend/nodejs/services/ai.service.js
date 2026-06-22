const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const embedder = require("../utils/embedder.util");
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

class AIService {
  // --- BƯỚC 1: TÌM KIẾM KIẾN THỨC BẰNG VECTOR ---
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

    // 3.5 Lấy thông tin user profile để AI biết tên khách hàng
    let userName = "quý khách";
    if (userId) {
      const userProfile = await prisma.user_profiles.findFirst({
        where: { user_id: userId }
      });
      if (userProfile && userProfile.full_name) {
        userName = userProfile.full_name;
      }
    }

    // 4. Tạo Prompt và gọi LLM (Groq)
    const systemPrompt = `
      Bạn là Trợ lý Tư vấn Kỹ thuật & Bán hàng chuyên nghiệp của xưởng cơ khí KPM.
      Khách hàng hiện tại của bạn tên là: "${userName}". Hãy xưng hô lịch sự, thân thiện (luôn xưng "em", gọi khách là "anh/chị ${userName}" hoặc tên của họ, dùng từ "Dạ", "ạ").

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
      selectedModel = "llama-3.1-8b-instant";
      console.log(`⚡ Khách hàng yêu cầu trả lời NHANH -> Chọn model 8B`);
    } else if (mode === "slow") {
      selectedModel = "llama-3.3-70b-versatile";
      console.log(`🧠 Khách hàng yêu cầu tư vấn SÂU -> Chọn model 70B`);
    } else {
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
      orderBy: { sent_at: "desc" },
      take: 10,
    });
    chatHistory = chatHistory.reverse();

    const conversationMessages = chatHistory.map((msg) => ({
      role: msg.sender_type === "ai" ? "assistant" : "user",
      content: msg.message_text,
    }));

    // 6. GỌI API & CƠ CHẾ FALLBACK
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
  async analyzeDrawing(imageUrl, sessionId, userId = null) {
    console.log(`🚀 Bắt đầu phân tích bản vẽ từ URL: ${imageUrl}`);
    
    // Tạo session nếu chưa có
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const newSession = await prisma.ai_chat_sessions.create({
        data: {
          user_id: userId,
          session_title: "Phân tích bản vẽ cơ khí",
        },
      });
      currentSessionId = newSession.id;
    }

    // Tạo tin nhắn placeholder để lấy messageId làm Foreign Key cho bảng ai_drawing_analyses
    const placeholderMessage = await prisma.ai_chat_messages.create({
      data: {
        session_id: currentSessionId,
        sender_type: "user",
        message_text: "Khách hàng đã tải lên một bản vẽ.",
      },
    });

    const visionSystemPrompt = `
      Bạn là một kỹ sư bóc tách khối lượng cơ khí lành nghề.
      Nhiệm vụ của bạn là phân tích hình ảnh bản vẽ và BẮT BUỘC trả về kết quả dưới định dạng JSON hợp lệ (Valid JSON).
      TUYỆT ĐỐI KHÔNG thêm bất kỳ giải thích, chú thích hay văn bản nào nằm ngoài khối JSON.

      CẤU TRÚC JSON BẮT BUỘC PHẢI TUÂN THỦ NGHIÊM NGẶT NHƯ VÍ DỤ SAU:
      {
      "is_valid_drawing": true, // Đánh giá: true nếu là bản vẽ/bản phác thảo cơ khí. Trả về false nếu là ảnh chụp người, động vật, phong cảnh, hoặc ảnh rác không liên quan.
        "message": "Để trống nếu hợp lệ. Nếu is_valid_drawing là false, hãy giải thích ngắn gọn lý do (VD: 'Dạ ảnh này có vẻ là ảnh chụp người, không phải bản vẽ kỹ thuật. Anh/chị gửi lại ảnh bản vẽ giúp em nhé!').",
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
      const response = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: visionSystemPrompt },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
        model: "meta-llama/llama-4-scout-17b-16e-instruct", // Model Vision Llama-4 mới nhất trên Groq
        temperature: 0.1,
      });

      let rawJsonString = response.choices[0].message.content;
      
      // 1. Trích xuất JSON từ markdown block nếu có
      const jsonMatch = rawJsonString.match(/```(?:json)?\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        rawJsonString = jsonMatch[1].trim();
      }

      // 2. Lấy nội dung từ dấu ngoặc nhọn đầu tiên đến cuối cùng để loại bỏ text rác
      const firstBrace = rawJsonString.indexOf('{');
      const lastBrace = rawJsonString.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        rawJsonString = rawJsonString.substring(firstBrace, lastBrace + 1);
      }

      let extractedSpecs = {};
      try {
        extractedSpecs = JSON.parse(rawJsonString);
        
        console.log("✅ AI đã bóc tách dữ liệu bản vẽ thành công:", extractedSpecs);
      } catch (parseError) {
        console.warn("⚠️ AI trả về JSON lỗi, dùng fallback. Dữ liệu gốc:", rawJsonString);
        extractedSpecs = {
           drawing_name: "Bản vẽ (AI không đọc được)",
           dimensions: {},
           scale_ratio: "N/A",
           description: "AI không thể định dạng đúng cấu trúc thông số. Lỗi: " + parseError.message
        };
      }
      // KIỂM TRA ẢNH RÁC NGAY TẠI ĐÂY
      if (extractedSpecs.is_valid_drawing === false) {
        const errorMessage = extractedSpecs.message || "Ảnh không hợp lệ, vui lòng tải lên bản vẽ kỹ thuật.";
        
        // Lưu câu trả lời từ chối của AI vào DB để lưu lịch sử
        await prisma.ai_chat_messages.create({
          data: {
            session_id: currentSessionId,
            sender_type: "ai",
            message_text: errorMessage,
          },
        });

        return {
          isErrorResponse: true,
          message: errorMessage,
          sessionId: currentSessionId
        };
      }

      const drawingAnalysis = await prisma.ai_drawing_analyses.create({
        data: {
          message_id: placeholderMessage.id, // Dùng ID tin nhắn vừa tạo
          drawing_name: extractedSpecs.drawing_name || "Bản vẽ chưa rõ tên",
          image_url: imageUrl,
          specifications: extractedSpecs.dimensions || {},
          scale_ratio: extractedSpecs.scale_ratio,
        },
      });
      
      // Gắn thêm sessionId vào response để trả về cho Client
      drawingAnalysis.sessionId = currentSessionId;
      return drawingAnalysis;
    } catch (error) {
      console.error("❌ Lỗi khi AI Vision phân tích bản vẽ:", error.message);
      throw error;
    }
  }

  // --- BƯỚC 4: LẤY LỊCH SỬ CHAT (HISTORY) ---
  async getUserSessions(userId) {
    if (!userId) return [];
    return await prisma.ai_chat_sessions.findMany({
      where: { user_id: userId },
      orderBy: { started_at: "desc" },
      select: {
        id: true,
        session_title: true,
        started_at: true,
      },
    });
  }

  async getSessionDetails(sessionId, userId) {
    const session = await prisma.ai_chat_sessions.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.user_id !== userId) {
      throw new Error("Phiên chat không tồn tại hoặc không có quyền truy cập!");
    }

    const messages = await prisma.ai_chat_messages.findMany({
      where: { session_id: sessionId },
      orderBy: { sent_at: "asc" },
      include: {
        ai_drawing_analyses: true,
      },
    });

    return { session, messages };
  }
}

module.exports = new AIService();
