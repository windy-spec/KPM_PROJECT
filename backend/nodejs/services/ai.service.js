const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const embedder = require("../utils/embedder.util");
const Groq = require("groq-sdk");
const { toolsDefinition, executeTool } = require("./ai-tools/index");
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
  async chatWithAI(userMessage, sessionID, mode, userId = null, imageUrl = null) {
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
        message_text: userMessage || "[Hình ảnh đính kèm]",
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
        where: { user_id: userId },
      });
      if (userProfile && userProfile.full_name) {
        userName = userProfile.full_name;
      }
    }

    // 4. Tạo Prompt và gọi LLM (Groq)
    const systemPrompt = `
      Bạn là AI Trợ lý của Xưởng Cơ Khí KPM. Khách hàng: "${userName}".
      
      [QUY TẮC ĐIỀU HƯỚNG TỐI THƯỢNG - CHỈ ĐƯỢC CHỌN 1 TRONG 4 LUỒNG SAU]:
      
      1. NẾU KHÁCH HỎI VỀ SẢN PHẨM: 
         - Nếu khách hàng chỉ gõ tên danh mục hoặc sản phẩm (VD: 'Cửa', 'Cổng', 'Lan can', 'Mái che'...), BẮT BUỘC phải hiểu đó là TÌM SẢN PHẨM và PHẢI gọi hàm tra cứu.
         - BẮT BUỘC gọi hàm tra cứu.
         - Nếu có sản phẩm: Tư vấn ngắn gọn và chèn tag PRODUCT_WIDGET đúng format.
         - Nếu không có: Tuyệt đối KHÔNG BỊA sản phẩm. Hãy nói xưởng không có mẫu đó và gợi ý các danh mục Cửa cổng, Lan can, Mái che.

      2. NẾU KHÁCH HỎI KIẾN THỨC KỸ THUẬT / VẬT LIỆU CƠ KHÍ:
         - Ưu tiên dùng "DỮ LIỆU TĨNH CỦA XƯỞNG" bên dưới.
         - Nếu là câu hỏi kiến thức cơ bản về VẬT LIỆU CƠ KHÍ (sắt, inox, nhôm, mạ kẽm, sơn tĩnh điện...), được phép dùng kiến thức chung để trả lời ngắn gọn, chính xác.
         - Sau khi giải đáp, BẮT BUỘC bẻ lái nhẹ nhàng: "Anh/chị đang cần làm gì từ vật liệu này, em hỗ trợ tư vấn thêm nhé!"
         - Nếu câu hỏi hoàn toàn không liên quan đến cơ khí/vật liệu, BẮT BUỘC trả lời: "Dạ vấn đề này nằm ngoài chuyên môn cơ khí của em. Anh/chị cần tư vấn làm Cửa, Cổng hay Lan can thì em hỗ trợ ngay ạ."

      3. NẾU KHÁCH HỎI VỀ ĐƠN HÀNG:
         - BẮT BUỘC gọi hàm kiểm tra đơn hàng.
         - Nếu không có: Báo chưa có, không chèn tag OPTIONS.
         - Nếu có nhiều đơn: Chèn OPTIONS đúng format ARRAY các mã đơn hàng.

      4. NẾU LÀ ẢNH BẢN VẼ: 
         - Nếu đúng bản vẽ: Chèn [DRAWING_SPECS: {...}] vào cuối.
         - Nếu ảnh mờ/lỗi: Báo khách chụp lại.
         - Nếu ảnh rác (chó mèo): Báo đây không phải bản vẽ.

      QUY TẮC TAG (CỰC KỲ NGHIÊM NGẶT - KHÔNG ĐƯỢC VI PHẠM):
      1. Cấm giải thích lệnh nội bộ ra cho khách.
      2. Các dấu chấm câu (.) phải dính liền với chữ cuối cùng.
      3. Tag PHẢI NẰM Ở DÒNG CUỐI CÙNG của câu trả lời.
      4. KHÔNG TỰ BỊA MÃ SẢN PHẨM HOẶC KIẾN THỨC.
      5. FORMAT TAG BẮT BUỘC - PHẢI TUÂN THỦ CHÍNH XÁC:
         - Widget sản phẩm: [PRODUCT_WIDGET: [{"id": "MA-SP", "reason": "Lý do"}]]
           ✅ ĐÚNG: [PRODUCT_WIDGET: [{"id": "CG-01", "reason": "Đúng yêu cầu"}]]
           ❌ SAI: [PRODUCT_WIDGET: {"name": "Cửa sắt"}]
         - Danh sách lựa chọn: [OPTIONS: ["Lựa chọn 1", "Lựa chọn 2"]]
           ✅ ĐÚNG: [OPTIONS: ["DH-001", "DH-002"]]
           ❌ SAI: [OPTIONS: {"status": "chưa có"}]
         - Thông số bản vẽ: [DRAWING_SPECS: {"name": "Tên bản vẽ", "scale": "1:100", "length": 1000, "width": 500, "height": 200}]
           * Trích xuất các thông số Chiều dài (length), Chiều rộng (width), Chiều cao (height) từ ảnh bản vẽ. Điền null nếu không có.
      6. Nếu không có gì để hiển thị trong tag, TUYỆT ĐỐI KHÔNG CHÈN TAG VÀO (bỏ hoàn toàn).
      
      DỮ LIỆU TĨNH CỦA XƯỞNG:
      ${contextText}
    `;

    // 5. CƠ CHẾ CHỌN MODEL (KẾT HỢP USER LỰA CHỌN & SMART ROUTING)
    let selectedModel = "llama-3.1-8b-instant"; // Khởi tạo biến

    if (imageUrl) {
      selectedModel = "meta-llama/llama-4-scout-17b-16e-instruct";
      console.log(`👁️ Có hình ảnh -> Chọn model Vision (Llama-4-Scout)`);
    } else if (mode === "fast") {
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

    const conversationMessages = chatHistory.map((msg, index) => {
      // Nếu là tin nhắn cuối cùng (hiện tại) và có imageUrl
      if (index === chatHistory.length - 1 && imageUrl && msg.sender_type === "user") {
        return {
          role: "user",
          content: [
            { type: "text", text: msg.message_text },
            { type: "image_url", image_url: { url: imageUrl } }
          ]
        };
      }
      return {
        role: msg.sender_type === "ai" ? "assistant" : "user",
        content: msg.message_text,
      };
    });

    // 6. GỌI API & CƠ CHẾ FALLBACK
    try {
      // Nhịp 1: Ném câu hỏi và Vali đồ nghề cho AI
      let messagesForGroq = [
        { role: "system", content: systemPrompt },
        ...conversationMessages,
      ];

      let requestPayload = {
        messages: messagesForGroq,
        model: selectedModel,
        temperature: 0.2,
        max_tokens: 1024,
      };

      // Tạm tắt Tool Calling cho model Llama 4 Vision để tránh lỗi Groq parser nhầm tag JSON thành Tool call
      if (selectedModel !== "meta-llama/llama-4-scout-17b-16e-instruct") {
        requestPayload.tools = toolsDefinition;
        requestPayload.tool_choice = "auto";
      }

      let chatCompletion = await groq.chat.completions.create(requestPayload);

      let responseMessage = chatCompletion.choices[0].message;

      // Nhịp 2: Nếu AI quyết định dùng Tool
      if (responseMessage.tool_calls) {
        console.log("🛠️ AI ĐANG KÍCH HOẠT FUNCTION CALLING!");
        messagesForGroq.push(responseMessage); // Lưu lại bước gọi hàm

        // Chạy lần lượt các tool mà AI yêu cầu
        for (const toolCall of responseMessage.tool_calls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);

          console.log(`▶️ Thực thi: ${functionName}`, functionArgs);

          // Cỗ máy tự động tìm file tool và chạy DB
          const functionResult = await executeTool(
            functionName,
            functionArgs,
            prisma,
            userId
          );

          // Nhồi kết quả DB gửi lại cho AI
          messagesForGroq.push({
            tool_call_id: toolCall.id,
            role: "tool",
            name: functionName,
            content: functionResult,
          });
        }

        // Kiểm tra nếu Tool trả về câu trả lời hoàn chỉnh (DIRECT_REPLY) -> bỏ qua AI lần 2
        const directReplyResult = messagesForGroq
          .filter(m => m.role === "tool")
          .find(m => typeof m.content === "string" && m.content.startsWith("[DIRECT_REPLY]"));

        if (directReplyResult) {
          console.log("⚡ Tool trả về DIRECT_REPLY, bỏ qua AI lần 2 để tránh hallucinate.");
          aiReply = directReplyResult.content.replace("[DIRECT_REPLY]", "").trim();
        } else {
          // Nhịp 3: AI đọc kết quả DB và trả lời khách
          const secondResponse = await groq.chat.completions.create({
            messages: messagesForGroq,
            model: selectedModel,
          });
          aiReply = secondResponse.choices[0].message.content;
        }
      } else {
        // Nếu câu hỏi giao tiếp bình thường, không cần tool
        aiReply = responseMessage.content;
      }
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

    // 6.5 Dọn dẹp lỗi hallucination của Model (Nếu nó vô tình nhả raw function tag ra màn hình)
    if (aiReply) {
      aiReply = aiReply.replace(/<function=[\s\S]*?<\/function>/g, '').trim();
      aiReply = aiReply.replace(/<function=[\s\S]*?>/g, '').trim(); 
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
      const firstBrace = rawJsonString.indexOf("{");
      const lastBrace = rawJsonString.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        rawJsonString = rawJsonString.substring(firstBrace, lastBrace + 1);
      }

      let extractedSpecs = {};
      try {
        extractedSpecs = JSON.parse(rawJsonString);

        console.log(
          "✅ AI đã bóc tách dữ liệu bản vẽ thành công:",
          extractedSpecs,
        );
      } catch (parseError) {
        console.warn(
          "⚠️ AI trả về JSON lỗi, dùng fallback. Dữ liệu gốc:",
          rawJsonString,
        );
        extractedSpecs = {
          drawing_name: "Bản vẽ (AI không đọc được)",
          dimensions: {},
          scale_ratio: "N/A",
          description:
            "AI không thể định dạng đúng cấu trúc thông số. Lỗi: " +
            parseError.message,
        };
      }
      // KIỂM TRA ẢNH RÁC NGAY TẠI ĐÂY
      if (extractedSpecs.is_valid_drawing === false) {
        const errorMessage =
          extractedSpecs.message ||
          "Ảnh không hợp lệ, vui lòng tải lên bản vẽ kỹ thuật.";

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
          sessionId: currentSessionId,
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

      // KIỂM TRA SẢN PHẨM TƯƠNG ĐƯƠNG TRONG DB
      const similarProducts = await prisma.products.findMany({
        where: {
          OR: [
            { product_name: { contains: extractedSpecs.drawing_name, mode: "insensitive" } },
            { product_code: { contains: extractedSpecs.drawing_name, mode: "insensitive" } }
          ]
        },
        include: { product_images: { where: { is_primary: true } } },
        take: 1
      });

      let aiSystemReply = "";
      let foundProductData = null;

      if (similarProducts.length > 0) {
        const p = similarProducts[0];
        const priceDisplay = p.base_price ? Number(p.base_price).toLocaleString("vi-VN") + "đ" : "Giá liên hệ";
        
        // Tạo thẻ PRODUCT_WIDGET
        const widgetTag = `[PRODUCT_WIDGET: [{"id": "${p.product_code}", "reason": "Mẫu tương đương"}]]`;
        
        aiSystemReply = `Bản vẽ của anh/chị là "${extractedSpecs.drawing_name}". Hệ thống tìm thấy mẫu tương tự đang có tại xưởng:\n- Mẫu: ${p.product_name} (Mã: ${p.product_code})\n- Giá tham khảo: ${priceDisplay}\n- Mô tả: ${p.description || "Đang cập nhật"}\n\nAnh/chị có thể chuyển sang trang báo giá để xem chi tiết vật tư và nhận báo giá trọn gói nhé!\n${widgetTag}`;
        
        foundProductData = {
          product_code: p.product_code,
          product_name: p.product_name,
          base_price: p.base_price,
          description: p.description
        };
      } else {
        aiSystemReply = `Bản vẽ của anh/chị là "${extractedSpecs.drawing_name}". Rất tiếc, xưởng KPM hiện tại chỉ nhận gia công các sản phẩm tiêu chuẩn có sẵn trên hệ thống để đảm bảo chất lượng tốt nhất. Nếu anh/chị cần gia công mẫu thiết kế riêng này, vui lòng để lại Số điện thoại hoặc liên hệ trực tiếp cho Admin qua số **0385891214** để được kỹ thuật viên hỗ trợ báo giá nhé.`;
      }

      await prisma.ai_chat_messages.create({
        data: {
          session_id: currentSessionId,
          sender_type: "ai",
          message_text: aiSystemReply,
        },
      });

      // Gắn thêm sessionId vào response để trả về cho Client
      drawingAnalysis.sessionId = currentSessionId;
      drawingAnalysis.similarProduct = foundProductData; // Gửi kèm cho Client nếu cần
      drawingAnalysis.replyMessage = aiSystemReply; // Trả về nội dung chat để Controller xuất ra
      
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
