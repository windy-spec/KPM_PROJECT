module.exports = {
  definition: {
    type: "function",
    function: {
      name: "tra_cuu_san_pham_va_danh_muc",
      description:
        "Tra cứu khi khách hỏi về MẪU SẢN PHẨM cụ thể hoặc HỎI THEO DANH MỤC.",
      parameters: {
        type: "object",
        properties: {
          product_type: {
            type: "string",
            description:
              "Tên cốt lõi của hạng mục sản phẩm. BẮT BUỘC chỉ là một danh từ ngắn gọn (Ví dụ: 'Cầu thang', 'Cổng', 'Lan can', 'Mái che'). KHÔNG bao gồm kích thước hay vật liệu ở đây.",
          },
          dimensions: {
            type: "string",
            description: "Kích thước khách hàng yêu cầu (nếu có). (Ví dụ: 'Dài 4m, ngang 5m', 'Cao 2m'). Để trống nếu khách không nhắc đến."
          },
          material: {
            type: "string",
            description: "Vật liệu khách yêu cầu (nếu có). (Ví dụ: 'Sắt', 'Inox 304', 'Kính cường lực'). Để trống nếu khách không nhắc."
          },
          search_intent: {
            type: "string",
            enum: ["category", "specific_product"],
            description:
              "Phân tích câu hỏi: Chọn 'category' nếu khách hỏi chung chung (VD: 'Có mẫu lan can nào?'). Chọn 'specific_product' nếu hỏi chi tiết (VD: 'Lan can kính cường lực tay vịn gỗ giá bao nhiêu?')",
          },
        },
        required: ["product_type", "search_intent"],
      },
    },
  },

  execute: async (args, prisma) => {
    try {
      // 1. Nếu khách hỏi Danh mục (Category)
      if (args.search_intent === "category") {
        const categories = await prisma.product_categories.findMany({
          where: {
            category_name: {
              contains: args.product_type,
              mode: "insensitive",
            },
          },
          include: {
            products: {
              select: { product_name: true, base_price: true },
              take: 3, // Lấy 3 sản phẩm tiêu biểu làm ví dụ
            },
          },
        });

        if (categories.length > 0) {
          return categories
            .map((cat) => {
              const sampleProducts = cat.products
                .map(
                  (p) =>
                    `- ${p.product_name}: ${p.base_price ? p.base_price.toLocaleString("vi-VN") + "đ" : "Chưa có giá"}`,
                )
                .join("\n");
              return `[Thông tin nội bộ cho AI]: Xưởng CÓ làm danh mục "${cat.category_name}".
Một số mẫu tiêu biểu để AI giới thiệu cho khách:
${sampleProducts || "Đang cập nhật mẫu mới."}

LƯU Ý NGỮ CẢNH: Khách đang yêu cầu kích thước [${args.dimensions || 'chưa rõ'}] và vật liệu [${args.material || 'chưa rõ'}]. 
Hãy tư vấn cụ thể dựa trên các mẫu có sẵn và khen ngợi sự lựa chọn kích thước/vật liệu của khách. Hãy nhấn mạnh xưởng chuyên gia công đo đạc thực tế theo đúng kích thước khách cần.`;
            })
            .join("\n\n");
        }
      }

      // 2. Nếu khách hỏi Sản phẩm cụ thể (Specific Product) hoặc không tìm thấy danh mục
      const products = await prisma.products.findMany({
        where: {
          OR: [
            {
              product_name: {
                contains: args.product_type,
                mode: "insensitive",
              },
            },
            {
              product_code: {
                contains: args.product_type,
                mode: "insensitive",
              },
            },
          ],
        },
        select: {
          product_code: true,
          product_name: true,
          base_price: true,
          description: true,
          product_categories: { select: { category_name: true } },
        },
        take: 5,
      });

      if (products.length > 0) {
        const formattedList = products.map((p) => {
          const priceDisplay = p.base_price
            ? Number(p.base_price).toLocaleString("vi-VN") + "đ"
            : "Giá liên hệ";
          return `- Mẫu: ${p.product_name} (Mã: ${p.product_code})\n  Giá: ${priceDisplay}\n  Đặc điểm: ${p.description || "Không có"}`;
        });
        return `[Thông tin nội bộ cho AI]: Tìm thấy các sản phẩm sau:
${formattedList.join("\n\n")}

LƯU Ý NGỮ CẢNH: Khách đang yêu cầu kích thước [${args.dimensions || 'chưa rõ'}] và vật liệu [${args.material || 'chưa rõ'}]. 
Hãy báo giá, tóm tắt đặc điểm và khẳng định xưởng hoàn toàn có thể làm theo đúng kích thước/vật liệu khách yêu cầu.`;
      }

      // Xử lý khi KHÔNG TÌM THẤY sản phẩm/danh mục
      const allCategories = await prisma.product_categories.findMany({ take: 5 });
      const listCat = allCategories.map(c => c.category_name).join(", ");
      return `[Chỉ đạo AI]: Khách đang tìm "${args.product_type}" nhưng trong kho chưa có sẵn mẫu chuẩn khớp từ khóa. 
TUY NHIÊN, hãy báo khách là xưởng CHUYÊN GIA CÔNG THEO YÊU CẦU riêng cho mọi kích thước (Khách đang cần: ${args.dimensions || 'chưa cung cấp'}). 
Đồng thời có thể gợi ý khách tham khảo các mảng xưởng đang làm mạnh như: ${listCat}.`;
    } catch (error) {
      console.error("Lỗi DB trong searchProduct:", error);
      return "Lỗi truy xuất cơ sở dữ liệu.";
    }
  },
};
