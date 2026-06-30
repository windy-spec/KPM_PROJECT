const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const embedder = require("../utils/embedder.util");
const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

class AIService {
  async chatWithAI(userMessage, sessionID, mode, userId = null, imageUrl = null) {
    // 1. Quản lý Phiên Chat (Session)
    let currentSessionId = sessionID;
    if (!currentSessionId) {
      // Nếu khách chưa có session, tạo mới
      const newSession = await prisma.ai_chat_sessions.create({
        data: {
          user_id: userId,
          session_title: userMessage ? userMessage.substring(0, 50) + "..." : "Chat mới",
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

    // 2.5 Lấy Lịch sử Chat (Memory Context) để truyền cho AI
    const rawHistory = await prisma.ai_chat_messages.findMany({
      where: { session_id: currentSessionId },
      orderBy: { sent_at: "desc" },
      take: 6 // Lấy 6 tin nhắn mới nhất
    });
    // Đảo ngược thứ tự (cũ -> mới), và LOẠI BỎ tin nhắn cuối cùng (vì tin nhắn cuối chính là userMessage hiện tại vừa được insert ở trên)
    const chatHistory = rawHistory.reverse().slice(0, -1).map(msg => ({
      role: msg.sender_type === "user" ? "user" : "assistant",
      content: msg.message_text
    }));
    const historyText = chatHistory.map(msg => `${msg.role === 'user' ? 'Khách' : 'AI'}: ${msg.content}`).join("\n");

    let aiReply = "";

    try {
      // KIẾN TRÚC HYBRID: CHUYỂN LOGIC VỀ BACKEND (NODEJS + PRISMA)
      switch (mode) {
        case "product_search":
          if (userMessage === "Danh mục sản phẩm") {
            const categories = await prisma.product_categories.findMany({ take: 6 });
            let catNames = categories.map(c => c.category_name);
            if (catNames.length === 0) {
              catNames = ["Cửa", "Cổng", "Lan can", "Mái che", "Hàng rào", "Cầu thang"];
            }
            aiReply = `Dạ xưởng KPM hiện có các danh mục sản phẩm chính sau, anh/chị đang quan tâm loại nào ạ?\n[OPTIONS: ${JSON.stringify(catNames)}]`;
            break;
          }

          // Dùng LLM bóc tách tham số json nhanh gọn
          const extractPrompt = `Dựa vào Lịch sử trò chuyện và Câu nói hiện tại, hãy trích xuất yêu cầu tìm kiếm sản phẩm cơ khí. Trả về JSON với cấu trúc:
{
  "product_type": "Tên sản phẩm chính (vd: Cửa, Cổng). Nếu khách hỏi tiếp về các sản phẩm vừa đề xuất (vd: 'cái nào rẻ nhất', 'màu gì'), trả về rỗng",
  "is_follow_up": true nếu câu nói là hỏi thêm thông tin, so sánh, hoặc thắc mắc về các sản phẩm AI vừa gợi ý trước đó, ngược lại false,
  "max_price": Giá tối đa khách muốn hoặc null,
  "min_price": Giá tối thiểu hoặc null
}

LỊCH SỬ CHAT GẦN ĐÂY:
${historyText}`;
          
          let searchParams = { product_type: null, max_price: null, min_price: null, is_follow_up: false };
          try {
            const extractResponse = await groq.chat.completions.create({
              messages: [
                { role: "system", content: extractPrompt },
                { role: "user", content: userMessage }
              ],
              model: "llama-3.1-8b-instant",
              response_format: { type: "json_object" },
              temperature: 0
            });
            searchParams = JSON.parse(extractResponse.choices[0].message.content);
          } catch(e) {
             console.error("Lỗi extract JSON:", e);
          }

          let productIdsToFetch = [];
          if (searchParams.is_follow_up) {
             const lastAiMsg = chatHistory.slice().reverse().find(m => m.role === "assistant");
             if (lastAiMsg && lastAiMsg.content.includes("[PRODUCT_WIDGET:")) {
                const match = lastAiMsg.content.match(/\[PRODUCT_WIDGET:\s*(\[[^\]]*\])/);
                if (match && match[1]) {
                   try {
                     const parsedIds = JSON.parse(match[1]);
                     productIdsToFetch = parsedIds.map(p => p.id);
                   } catch(e){}
                }
             }
          }

          let products = [];
          if (productIdsToFetch.length > 0) {
             products = await prisma.products.findMany({
               where: { product_code: { in: productIdsToFetch } }
             });
          } else {
             const whereClause = {};
             if (searchParams.product_type) {
               whereClause.OR = [
                 { product_name: { contains: searchParams.product_type, mode: "insensitive" } },
                 { product_code: { contains: searchParams.product_type, mode: "insensitive" } }
               ];
             }
             if (searchParams.max_price) whereClause.base_price = { ...whereClause.base_price, lte: searchParams.max_price };
             if (searchParams.min_price) whereClause.base_price = { ...whereClause.base_price, gte: searchParams.min_price };

             products = await prisma.products.findMany({
               where: whereClause,
               take: 3
             });
          }

          if (products.length === 0) {
            // Xử lý từ chối cứng ngay tại đây nếu DB trả về mảng rỗng []
            aiReply = "Dạ rất tiếc hiện tại xưởng KPM không có sản phẩm nào khớp với yêu cầu của anh/chị. Anh/chị có thể tham khảo các danh mục khác như Cửa, Cổng, Lan can, Mái che ạ.";
          } else {
            // Đẩy dữ liệu thô (dbContext) cho LLM xào nấu lại
            const dbContext = products.map(p => 
              `- Mẫu: ${p.product_name} (Mã: ${p.product_code})\n  Giá: ${p.base_price ? Number(p.base_price).toLocaleString("vi-VN") + "đ" : "Liên hệ"}\n  Mô tả kỹ thuật: ${p.description ? p.description.substring(0, 200) + "..." : "Đang cập nhật"}`
            ).join("\n\n");
            
            const productIds = products.map(p => `{"id": "${p.product_code}"}`).join(", ");
            
            let prompt = "";
            if (searchParams.is_follow_up) {
              prompt = `Bạn là trợ lý cơ khí KPM. Khách đang hỏi thêm chi tiết về các sản phẩm bạn vừa gợi ý trước đó.
DỮ LIỆU SẢN PHẨM ĐANG BÀN LUẬN:
${dbContext}

NHIỆM VỤ:
1. Trả lời trực tiếp, thông minh và thân thiện câu hỏi của khách hàng dựa vào DỮ LIỆU trên.
2. BẠN ĐƯỢC PHÉP phân tích, so sánh giá cả, vật liệu, ưu nhược điểm nếu khách yêu cầu. Hãy trình bày bằng Markdown (in đậm, gạch đầu dòng) cho dễ đọc.
3. Nếu bạn nhắc đến 1 sản phẩm cụ thể có trong dữ liệu trên, hãy CHÈN LẠI thẻ [PRODUCT_WIDGET: [{"id": "MÃ CỦA SẢN PHẨM ĐÓ"}]] ở cuối câu để hiện ảnh minh họa.`;
            } else {
              prompt = `Bạn là trợ lý cơ khí KPM. Khách đang tìm kiếm sản phẩm mới. 
DỮ LIỆU TÌM THẤY TRONG DATABASE XƯỞNG:
${dbContext}

NHIỆM VỤ: 
1. Chỉ viết ĐÚNG 1-2 câu ngắn gọn, thân thiện để mào đầu (Ví dụ: "Dạ, em gửi anh/chị tham khảo một số mẫu bên xưởng em ạ:").
2. TUYỆT ĐỐI KHÔNG phân tích, không liệt kê lại tên, giá hay mô tả của sản phẩm vì hệ thống sẽ tự động hiển thị thông tin này qua Thẻ Sản Phẩm.
3. BẮT BUỘC chèn đoạn tag sau vào dòng cuối cùng của câu trả lời, không được tự ý sửa đổi mã ID:
[PRODUCT_WIDGET: [${productIds}]]`;
            }
            
            const aiResponse = await groq.chat.completions.create({
              messages: [
                { role: "system", content: prompt },
                ...chatHistory,
                { role: "user", content: userMessage }
              ],
              model: "llama-3.1-8b-instant",
              temperature: 0.3
            });
            aiReply = aiResponse.choices[0].message.content;
          }
          break;

        case "order_tracking":
          // LUỒNG CẤM LLM CAN THIỆP
          if (!userId) {
            aiReply = "Dạ anh/chị cần đăng nhập để sử dụng tính năng tra cứu đơn hàng cá nhân ạ.";
            break;
          }
          
          // Trích xuất mã đơn hàng bằng Regex nhanh thay vì dùng AI
          const orderCodeMatch = userMessage.match(/(?:KPM-)?(?:DH-|ORD-)[A-Z0-9\-]+/i);
          const orderCode = orderCodeMatch ? orderCodeMatch[0].replace(/-+$/, "") : null;

          if (!orderCode) {
            const recentOrders = await prisma.orders.findMany({
              where: { user_id: userId },
              orderBy: { created_at: "desc" },
              take: 10
            });

            if (recentOrders.length === 0) {
              aiReply = "Dạ hệ thống chưa ghi nhận đơn hàng nào của anh/chị. Nếu anh/chị có mã đơn hàng, vui lòng gõ mã (vd: ORD-123) để em kiểm tra nhé.";
            } else {
              const options = recentOrders.map(o => o.order_code);
              // Gửi lệnh tạo Combobox ra Frontend (DIRECT_REPLY, ko qua LLM)
              aiReply = `Dạ em tìm thấy ${recentOrders.length} đơn hàng gần đây của anh/chị. Anh/chị chọn đơn hàng cần kiểm tra nhé!\n[OPTIONS: ${JSON.stringify(options)}]`;
            }
          } else {
            const order = await prisma.orders.findUnique({
              where: { order_code: orderCode },
              include: { order_tracking: { orderBy: { tracked_at: "desc" }, take: 1 } }
            });

            if (!order) {
              aiReply = `Dạ em không tìm thấy đơn hàng mã ${orderCode}. Anh/chị kiểm tra lại mã giúp em nhé.`;
            } else {
              const TRACKING_MAP = {
                "pending": "Đã nhận đc đơn",
                "admin_approved": "Đã duyệt đơn",
                "pending_payment": "Đang chờ thanh toán",
                "WAITING_WAREHOUSE": "Đã chuyển kho chờ sản xuất",
                "MANUFACTURING": "Xưởng đang sản xuất",
                "completed": "Đã hoàn thành",
                "cancelled": "Đã hủy"
              };
              const statusDesc = TRACKING_MAP[order.production_status] || order.production_status || "Đang xử lý";
              const latestTracking = order.order_tracking.length > 0 ? order.order_tracking[0].stage_name : "Đã tiếp nhận";
              aiReply = `Dạ đơn hàng **${order.order_code}** của anh/chị đang ở trạng thái: **${statusDesc}**.\nTiến độ xưởng: ${latestTracking}.`;
            }
          }
          break;

        case "knowledge_support":
          if (userMessage === "Tư vấn kỹ thuật" || userMessage === "Tư vấn chuyên sâu" || userMessage === "Cho tôi hỏi về vật liệu cơ khí và quy trình gia công của xưởng") {
            aiReply = `Dạ xưởng KPM sẵn sàng hỗ trợ kỹ thuật chuyên sâu. Anh/chị đang cần tìm hiểu về mảng nào ạ?\n[OPTIONS: ["Vật tư & Báo giá", "Gia công & Lắp ráp", "Bảo hành & Lỗi thường gặp", "Tư vấn Thiết kế"]]`;
            break;
          }
          if (userMessage === "Vật tư & Báo giá") {
            aiReply = `Về vật tư và báo giá, anh/chị cần tư vấn cụ thể về hạng mục nào?\n[OPTIONS: ["Sắt & Thép mạ kẽm", "Nhôm kính & Inox", "Sơn & Phụ kiện", "Cách tính m2/bóc tách"]]`;
            break;
          }
          if (userMessage === "Gia công & Lắp ráp") {
            aiReply = `Về gia công lắp ráp, anh/chị đang vướng mắc ở phần nào?\n[OPTIONS: ["Kỹ thuật hàn & chà nhám", "Quy trình sơn", "Cách dựng trụ cổng/lợp mái", "Thi công trên cao"]]`;
            break;
          }
          if (userMessage === "Bảo hành & Lỗi thường gặp") {
            aiReply = `Dạ anh/chị đang gặp vấn đề gì với sản phẩm ạ?\n[OPTIONS: ["Cổng xệ / Kẹt bản lề", "Cửa cuốn / Cửa kéo kêu to", "Dột mái tôn / Lão hóa keo", "Rỉ sét / Phai màu sơn"]]`;
            break;
          }
          if (userMessage === "Tư vấn Thiết kế") {
            aiReply = `Anh/chị cần tư vấn thiết kế cho sản phẩm nào ạ?\n[OPTIONS: ["Nhà phố mặt tiền hẹp", "Nhà phong cách hiện đại", "Số đo Lỗ ban Phong thủy", "Bậc Cầu thang Sinh-Lão"]]`;
            break;
          }

          // Tới bước này là đã thu thập đủ thông tin, tiến hành Vector Search lấy chính sách / kiến thức
          const queryVector = await embedder.getVector(userMessage);
          const vectorString = `[${queryVector.join(",")}]`;
          const rules = await prisma.$queryRaw`
            SELECT rule_title, rule_content
            FROM ai_knowledge_base
            ORDER BY embedding_vector <=> ${vectorString}::vector
            LIMIT 3;
          `;
          let contextText = "Không có dữ liệu trong hệ thống.";
          if (rules.length > 0) {
            contextText = rules.map((r) => `-${r.rule_title}: ${r.rule_content}`).join("\n");
          }

          const ksPrompt = `Bạn là trợ lý kỹ thuật của Xưởng Cơ Khí KPM.
DỮ LIỆU CHÍNH THỨC CỦA XƯỞNG:
${contextText}

NHIỆM VỤ: 
1. Ưu tiên trả lời dựa trên DỮ LIỆU CHÍNH THỨC CỦA XƯỞNG được cung cấp phía trên.
2. Nếu câu hỏi thuộc chuyên môn cơ khí nhưng DỮ LIỆU CỦA XƯỞNG không có, bạn được phép DÙNG KIẾN THỨC CƠ KHÍ của bạn để tư vấn khái quát cho khách, nhưng nhớ dặn dò khách liên hệ trực tiếp xưởng để được báo giá và tư vấn chính xác nhất.
3. Nếu câu hỏi hoàn toàn không liên quan đến lĩnh vực cơ khí/xây dựng (ví dụ hỏi thời tiết, toán học, lịch sử), BẮT BUỘC từ chối khéo: "Dạ vấn đề này nằm ngoài chuyên môn cơ khí của KPM, em không thể hỗ trợ ạ."
4. Hãy sử dụng định dạng Markdown (in đậm, gạch đầu dòng) để trình bày cho dễ đọc.`;

          const ksResponse = await groq.chat.completions.create({
            messages: [
              { role: "system", content: ksPrompt },
              ...chatHistory,
              { role: "user", content: userMessage }
            ],
            model: "llama-3.1-8b-instant",
            temperature: 0.1
          });
          aiReply = ksResponse.choices[0].message.content;
          
          // Tự động gài nút chọn lại mảng tư vấn cho khách dễ bấm nếu AI chưa có gợi ý nào
          if (!aiReply.includes("[OPTIONS:")) {
            aiReply += `\n\n[OPTIONS: ["Tư vấn kỹ thuật"]]`;
          }
          break;

        case "vision_analysis":
          if (!imageUrl) {
            aiReply = "Dạ anh/chị vui lòng nhấn nút Đính kèm (Ghim) để tải lên hình ảnh bản vẽ kỹ thuật nhé.";
          } else {
            const visionResult = await this.analyzeDrawing(imageUrl, currentSessionId, userId);
            aiReply = visionResult.replyMessage || visionResult.message;
          }
          break;

        default:
          aiReply = "Dạ anh/chị vui lòng chọn một chủ đề trên Menu (Tìm kiếm sản phẩm, Tra cứu đơn hàng, Tư vấn kỹ thuật, Phân tích bản vẽ) để em hỗ trợ chính xác nhất ạ!";
      }
    } catch (error) {
      console.error(`❌ Lỗi hệ thống AI:`, error.message);
      aiReply = "Dạ hệ thống AI đang bảo trì đột xuất, anh/chị vui lòng chờ trong giây lát rồi thử lại nhé ạ.";
    }

    // 7. Lưu câu trả lời của AI vào DB
    await prisma.ai_chat_messages.create({
      data: {
        session_id: currentSessionId,
        sender_type: "ai",
        message_text: aiReply,
      },
    });

    return {
      sessionId: currentSessionId,
      reply: aiReply,
    };
  }

  // --- BƯỚC 3: AI VISION PHÂN TÍCH ẢNH BẢN VẼ ---
  async analyzeDrawing(imageUrl, sessionId, userId = null) {
    console.log(`🚀 Bắt đầu phân tích bản vẽ từ URL: ${imageUrl}`);

    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const newSession = await prisma.ai_chat_sessions.create({
        data: { user_id: userId, session_title: "Phân tích bản vẽ cơ khí" },
      });
      currentSessionId = newSession.id;
    }

    const placeholderMessage = await prisma.ai_chat_messages.create({
      data: { session_id: currentSessionId, sender_type: "user", message_text: "Khách hàng đã tải lên bản vẽ." },
    });

    const visionSystemPrompt = `Bạn là một kỹ sư bóc tách khối lượng cơ khí lành nghề.
Nhiệm vụ của bạn là phân tích hình ảnh bản vẽ và BẮT BUỘC trả về kết quả dưới định dạng JSON hợp lệ.
TUYỆT ĐỐI KHÔNG thêm văn bản nằm ngoài JSON.
Sử dụng Markdown (in đậm, gạch đầu dòng) trong phần diễn giải (nếu có).

CẤU TRÚC JSON:
{
  "is_valid_drawing": true, // false nếu là ảnh người, vật, phong cảnh.
  "message": "Để trống nếu hợp lệ. Nếu false, hãy giải thích từ chối.",
  "drawing_name": "Tên chủ thể bản vẽ",
  "dimensions": { "length": 290, "width": null, "height": 340 },
  "scale_ratio": "1:100",
  "description": "Ghi chú vật liệu..."
}`;

    try {
      const response = await groq.chat.completions.create({
        messages: [
          { role: "user", content: [{ type: "text", text: visionSystemPrompt }, { type: "image_url", image_url: { url: imageUrl } }] },
        ],
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        temperature: 0.1,
      });

      let rawJsonString = response.choices[0].message.content;
      const jsonMatch = rawJsonString.match(/```(?:json)?\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) rawJsonString = jsonMatch[1].trim();

      const firstBrace = rawJsonString.indexOf("{");
      const lastBrace = rawJsonString.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        rawJsonString = rawJsonString.substring(firstBrace, lastBrace + 1);
      }

      let extractedSpecs = {};
      try {
        extractedSpecs = JSON.parse(rawJsonString);
      } catch (e) {
        extractedSpecs = { is_valid_drawing: false, message: "AI không thể đọc thông số, ảnh quá mờ." };
      }

      if (extractedSpecs.is_valid_drawing === false) {
        const errorMessage = extractedSpecs.message || "Ảnh không hợp lệ, vui lòng tải lên bản vẽ kỹ thuật.";
        return { isErrorResponse: true, message: errorMessage, sessionId: currentSessionId };
      }

      const drawingAnalysis = await prisma.ai_drawing_analyses.create({
        data: {
          message_id: placeholderMessage.id,
          drawing_name: extractedSpecs.drawing_name || "Bản vẽ",
          image_url: imageUrl,
          specifications: extractedSpecs.dimensions || {},
          scale_ratio: extractedSpecs.scale_ratio,
        },
      });

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
        const widgetTag = `[PRODUCT_WIDGET: [{"id": "${p.product_code}", "reason": "Mẫu tương đương"}]]`;
        aiSystemReply = `Bản vẽ của anh/chị là "${extractedSpecs.drawing_name}". Hệ thống tìm thấy mẫu tương tự đang có tại xưởng:\n- Mẫu: ${p.product_name} (Mã: ${p.product_code})\n- Giá tham khảo: ${priceDisplay}\n\n${widgetTag}`;
        foundProductData = p;
      } else {
        aiSystemReply = `Bản vẽ của anh/chị là "${extractedSpecs.drawing_name}". Xưởng KPM hiện tại nhận gia công các sản phẩm tiêu chuẩn có sẵn. Nếu anh/chị cần gia công mẫu riêng này, vui lòng liên hệ trực tiếp cho Admin qua số **0385891214** nhé.`;
      }

      const specsJson = JSON.stringify({
        name: extractedSpecs.drawing_name || "Bản vẽ phân tích",
        length: extractedSpecs.dimensions?.length,
        width: extractedSpecs.dimensions?.width,
        height: extractedSpecs.dimensions?.height,
        scale: extractedSpecs.scale_ratio
      });
      aiSystemReply += `\n[DRAWING_SPECS: ${specsJson}]`;

      drawingAnalysis.sessionId = currentSessionId;
      drawingAnalysis.similarProduct = foundProductData;
      drawingAnalysis.replyMessage = aiSystemReply;
      return drawingAnalysis;
    } catch (error) {
      console.error("❌ Lỗi Vision:", error.message);
      throw error;
    }
  }

  // --- LỊCH SỬ CHAT ---
  async getUserSessions(userId) {
    if (!userId) return [];
    return await prisma.ai_chat_sessions.findMany({
      where: { user_id: userId },
      orderBy: { started_at: "desc" },
      select: { id: true, session_title: true, started_at: true },
    });
  }

  async getSessionDetails(sessionId, userId) {
    const session = await prisma.ai_chat_sessions.findUnique({ where: { id: sessionId } });
    if (!session || session.user_id !== userId) throw new Error("Phiên chat không tồn tại!");
    const messages = await prisma.ai_chat_messages.findMany({
      where: { session_id: sessionId },
      orderBy: { sent_at: "asc" },
      include: { ai_drawing_analyses: true },
    });
    return { session, messages };
  }
}

module.exports = new AIService();
