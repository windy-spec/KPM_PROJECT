module.exports = {
  definition: {
    type: "function",
    function: {
      name: "tra_cuu_tien_do_don_hang",
      description: "Sử dụng khi khách hàng muốn hỏi thăm hoặc kiểm tra tiến độ của đơn hàng (VD: 'Đơn hàng của tôi xong chưa?', 'Bao giờ giao hàng?').",
      parameters: {
        type: "object",
        properties: {
          order_code: {
            type: ["string", "null"],
            description: "Mã đơn hàng khách cung cấp (VD: 'ORD-123'). Nếu khách chưa cung cấp mã, hãy để null.",
          },

          user_id: {
            type: "string",
            description: "User ID của khách hàng đang chat (lấy từ thông tin hệ thống). Rất quan trọng để tìm đơn hàng cũ nếu khách quên mã.",
          }
        },
      },
    },
  },
  execute: async (args, prisma) => {
    try {
      // Trường hợp khách KHÔNG CUNG CẤP mã đơn hàng
      if (!args.order_code) {
        if (!args.user_id || args.user_id === 'Khách vãng lai') {
           return "[Chỉ đạo AI]: Khách chưa đăng nhập và không cung cấp mã. Hãy yêu cầu khách đăng nhập hoặc cung cấp mã đơn hàng cụ thể.";
        }
        
        // Tìm 3 đơn hàng gần nhất của user
        let recentOrders = [];
        try {
          recentOrders = await prisma.orders.findMany({
             where: { user_id: args.user_id },
             orderBy: { created_at: "desc" },
             take: 3
          });
        } catch (e) {
          // Ignore invalid UUID errors from Prisma
          recentOrders = [];
        }
        
        if (recentOrders.length === 0) {
           return `[LỆNH TỪ HỆ THỐNG]: Khách chưa có đơn hàng nào.\n[HÀNH ĐỘNG]: BẮT BUỘC trả lời đúng câu sau: "Dạ hệ thống chưa ghi nhận đơn hàng nào của số điện thoại / tài khoản này. Anh/chị kiểm tra lại thông tin giúp em nhé."`;
        }
        
        const orderCodes = recentOrders.map(o => o.order_code);
        const optionsArrayStr = JSON.stringify(orderCodes);
        // Trả về câu trả lời hoàn chỉnh (bypass AI để tránh hallucinate OPTIONS)
        return `[DIRECT_REPLY]Dạ, em tìm thấy ${recentOrders.length} đơn hàng gần đây của anh/chị. Anh/chị vui lòng chọn đơn hàng muốn kiểm tra nhé!\n[OPTIONS: ${optionsArrayStr}]`;
      }

      // Trường hợp khách CÓ CUNG CẤP mã đơn hàng
      const order = await prisma.orders.findUnique({
        where: { order_code: args.order_code },
        include: {
          order_tracking: {
            orderBy: { tracked_at: "desc" },
            take: 1
          }
        },
      });

      if (!order) {
        return `[LỆNH TỪ HỆ THỐNG]: KHÔNG TÌM THẤY đơn hàng mã ${args.order_code}.\n[HÀNH ĐỘNG]: BẮT BUỘC trả lời: "Dạ hệ thống chưa ghi nhận đơn hàng mã ${args.order_code}. Anh/chị kiểm tra lại thông tin giúp em nhé."`;
      }

      const TRACKING_MAP = {
        "pending": "Đã nhận đc đơn",
        "admin_approved": "Đã nhận đc đơn",
        "pending_payment": "Đang xử lý",
        "pending_deposit": "Đang xử lý",
        "WAITING_WAREHOUSE": "Đã chuyển kho",
        "EXPORTING_WAREHOUSE": "Đã chuyển kho",
        "out_of_stock": "Đã chuyển kho",
        "production_ready": "Kho bắt đầu sản xuất",
        "producing": "Kho bắt đầu sản xuất",
        "MANUFACTURING": "Kho bắt đầu sản xuất",
        "completed": "Đã hoàn thành",
        "cancelled": "Đã hủy"
      };

      const rawStatus = order.production_status || "Đang xử lý";
      const statusDesc = TRACKING_MAP[rawStatus] || rawStatus;
      const latestTracking = order.order_tracking.length > 0 ? order.order_tracking[0].stage_name : "Đã tiếp nhận";
      
      return `[LỆNH TỪ HỆ THỐNG]: Đã tra cứu thành công đơn hàng.\nThông tin:\n- Mã đơn: ${order.order_code}\n- Trạng thái: ${statusDesc}\n- Tiến độ xưởng: ${latestTracking}\n\n[HÀNH ĐỘNG]: Báo cáo tiến độ này cho khách một cách lịch sự, thân thiện.`;
    } catch (error) {
      console.error("Lỗi DB trong trackOrder:", error);
      return "Hệ thống đang lỗi, không thể tra cứu lúc này.";
    }
  },
};
