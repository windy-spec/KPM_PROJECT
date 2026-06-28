module.exports = {
  definition: {
    type: "function",
    function: {
      name: "xem_lich_su_dat_hang_cu",
      description: "Sử dụng khi khách hàng muốn làm thêm sản phẩm dựa trên phong cách/mẫu mã cũ mà họ đã từng đặt (VD: 'Làm tôi thêm cái lan can giống phong cách đợt trước'). Bắt buộc phải có userId của khách.",
      parameters: {
        type: "object",
        properties: {
          userId: {
            type: "string",
            description: "User ID của khách hàng. Phải hỏi hệ thống để lấy giá trị này nếu có.",
          },
        },
        required: ["userId"],
      },
    },
  },
  execute: async (args, prisma) => {
    try {
      if (!args.userId) {
         return "[Chỉ đạo AI]: Không tìm thấy thông tin đăng nhập của khách. Vui lòng yêu cầu khách đăng nhập hoặc cung cấp số điện thoại/mã đơn hàng cũ để tìm tay.";
      }
      
      // Tìm đơn hàng gần nhất của user này
      const lastOrder = await prisma.orders.findFirst({
        where: { user_id: args.userId },
        orderBy: { created_at: 'desc' },
        include: {
          quotations: {
             include: {
                quotation_specs: {
                   include: { materials: true, paint_types: true }
                }
             }
          }
        },
      });

      if (!lastOrder) {
        return `[Chỉ đạo AI]: Khách hàng này chưa có lịch sử đặt hàng nào trên hệ thống.`;
      }

      let oldSpecs = "Không có thông tin chi tiết vật tư";
      if (lastOrder.quotations && lastOrder.quotations.quotation_specs.length > 0) {
         const specs = lastOrder.quotations.quotation_specs.map(q => 
             `- Hạng mục: ${q.component_name || 'Không rõ'}, Vật liệu: ${q.materials?.material_name || 'Không rõ'}, Sơn: ${q.paint_types?.paint_name || 'Không rõ'}`
         );
         oldSpecs = specs.join("\n");
      }

      return `[Thông tin nội bộ cho AI]:
Đơn hàng cũ gần nhất của khách (Mã: ${lastOrder.order_code}):
Ngày đặt: ${lastOrder.created_at}
Vật liệu cũ đã dùng:
${oldSpecs}

Hãy dùng thông tin này để tư vấn (Recommend) cho khách sản phẩm mới đồng bộ về phong cách, vật liệu với đơn cũ. Truyền vật liệu/phong cách này vào tool tra_cuu_san_pham_va_danh_muc nếu cần.`;
    } catch (error) {
      console.error("Lỗi DB trong getPastOrder:", error);
      return "Hệ thống đang lỗi, không thể tra cứu lúc này.";
    }
  },
};
