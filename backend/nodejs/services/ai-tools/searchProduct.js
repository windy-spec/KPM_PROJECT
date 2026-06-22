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
          search_keyword: {
            type: "string",
            description:
              "Từ khóa chính (VD: 'Lan can', 'Cửa cuốn', 'Sắt mỹ thuật')",
          },
          search_intent: {
            type: "string",
            enum: ["category", "specific_product"],
            description:
              "Phân tích câu hỏi: Chọn 'category' nếu khách hỏi chung chung (VD: 'Có mẫu lan can nào?'). Chọn 'specific_product' nếu hỏi chi tiết (VD: 'Lan can kính cường lực tay vịn gỗ giá bao nhiêu?')",
          },
        },
        required: ["search_keyword", "search_intent"],
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
              contains: args.search_keyword,
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
              return `[Thông tin nội bộ cho AI]: Xưởng CÓ làm danh mục "${cat.category_name}".\nMột số mẫu tiêu biểu để AI giới thiệu cho khách:\n${sampleProducts || "Đang cập nhật mẫu mới."}\nHãy dựa vào đây để gợi ý khách chọn mẫu hoặc hỏi thêm yêu cầu.`;
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
                contains: args.search_keyword,
                mode: "insensitive",
              },
            },
            {
              product_code: {
                contains: args.search_keyword,
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
        return `[Thông tin nội bộ cho AI]: Tìm thấy các sản phẩm sau:\n${formattedList.join("\n\n")}\nHãy báo giá và tóm tắt đặc điểm cho khách một cách tự nhiên.`;
      }

      return `[Thông tin nội bộ cho AI]: Xưởng KHÔNG có danh mục hoặc sản phẩm nào khớp với từ khóa "${args.search_keyword}". Hãy báo khách gửi bản vẽ hoặc ý tưởng để xưởng thiết kế riêng.`;
    } catch (error) {
      console.error("Lỗi DB trong searchProduct:", error);
      return "Lỗi truy xuất cơ sở dữ liệu.";
    }
  },
};
