module.exports = {
  definition: {
    type: "function",
    function: {
      name: "tra_cuu_san_pham_va_danh_muc",
      description:
        "Tra cứu khi khách hỏi về MẪU SẢN PHẨM cụ thể, HỎI THEO DANH MỤC, hoặc TÌM GIẢI PHÁP cho một vấn đề (Multi-Intent).",
      parameters: {
        type: "object",
        properties: {
          product_type: {
            type: "string",
            description:
              "Tên cốt lõi của hạng mục sản phẩm. BẮT BUỘC chỉ là một danh từ ngắn gọn (Ví dụ: 'Cổng', 'Lan can', 'Hàng rào', 'Mái che'). KHÔNG bao gồm kích thước hay vật liệu ở đây. Nếu khách chỉ hỏi mã (vd 'LC-05'), hãy truyền mã đó vào đây.",
          },
          problem: {
            type: "string",
            description:
              "Khó khăn, vấn đề hoặc nhu cầu đặc biệt của khách hàng (nếu có). (Ví dụ: 'ban công hẹp', 'nhà hướng tây', 'chống trộm'). Để trống nếu không có.",
          },
          dimensions: {
            type: "string",
            description: "Kích thước khách hàng yêu cầu (nếu có). (Ví dụ: 'Dài 4m, ngang 5m', 'Cao 2m'). Để trống nếu khách không nhắc đến."
          },
          material: {
            type: "string",
            description: "Vật liệu khách yêu cầu (nếu có). (Ví dụ: 'Sắt', 'Inox 304', 'Kính cường lực'). Để trống nếu khách không nhắc."
          },
          intent: {
            type: "string",
            enum: ["specific", "exploratory", "category"],
            description:
              "Ý định tìm kiếm. 'category': Hỏi danh mục chung. 'specific': Đưa ra một mã/tên cụ thể. 'exploratory': Đang tìm kiếm giải pháp hoặc trình bày một vấn đề.",
          },
        },
        required: ["product_type", "intent"],
      },
    },
  },

  execute: async (args, prisma) => {
    try {
      let foundProducts = [];
      const intentStr = args.intent || "specific";
      const intents = [intentStr];

      // 1. Nếu khách hỏi Danh mục (Category)
      if (intents.includes("category") && !intents.includes("specific")) {
        const categories = await prisma.product_categories.findMany({
          where: { category_name: { contains: args.product_type, mode: "insensitive" } },
          include: {
            products: {
              select: { product_code: true, product_name: true, base_price: true, description: true },
              take: 3,
            },
          },
        });

        if (categories.length > 0) {
          return categories
            .map((cat) => {
              const sampleProducts = cat.products
                .map((p) => `- Mẫu: ${p.product_name} (Mã: ${p.product_code}) - Giá: ${p.base_price ? p.base_price.toLocaleString("vi-VN") + "đ" : "Liên hệ"}`)
                .join("\n");
              return `[LỆNH TỪ HỆ THỐNG]: Khách đang tìm mẫu thuộc danh mục "${cat.category_name}". Mẫu chính xác có thể không có, nhưng xưởng CÓ SẴN các mẫu này:\n${sampleProducts}\n\n[HÀNH ĐỘNG]: Hãy tư vấn bẻ lái khách sang các mẫu trên và dùng [OPTIONS: ["Tên mẫu 1", "Tên mẫu 2"]] để khách chọn. Cấm bịa mã.`;
            })
            .join("\n\n");
        }
      }

      // 2. Multi-Intent: Tìm mã cụ thể HOẶC Giải pháp
      // 2A. Tìm mã/tên cụ thể
      if (intents.includes("specific") || args.product_type) {
        const specificProducts = await prisma.products.findMany({
          where: {
            OR: [
              { product_name: { contains: args.product_type, mode: "insensitive" } },
              { product_code: { contains: args.product_type, mode: "insensitive" } },
            ],
          },
          include: { product_images: { where: { is_primary: true } } },
          take: 3,
        });
        foundProducts = [...specificProducts];
      }

      // 2B. Tìm theo vấn đề (Exploratory / problem)
      if (args.problem) {
        const problemProducts = await prisma.products.findMany({
          where: {
            OR: [
              { description: { contains: args.problem, mode: "insensitive" } },
              { product_name: { contains: args.problem, mode: "insensitive" } },
            ],
          },
          include: { product_images: { where: { is_primary: true } } },
          take: 3,
        });
        
        // Gộp kết quả, tránh trùng lặp
        problemProducts.forEach(p => {
          if (!foundProducts.find(fp => fp.id === p.id)) foundProducts.push(p);
        });
      }

      // Format lại danh sách sản phẩm trả về
      if (foundProducts.length > 0) {
        const formattedList = foundProducts.map((p) => {
          const priceDisplay = p.base_price ? Number(p.base_price).toLocaleString("vi-VN") + "đ" : "Giá liên hệ";
          return `- Mẫu: ${p.product_name} (Mã: ${p.product_code})\n  Giá: ${priceDisplay}\n  Đặc điểm: ${p.description || "Không có"}`;
        });
        return `[LỆNH TỪ HỆ THỐNG]: Đã tìm thấy sản phẩm trong Database:\n${formattedList.join("\n\n")}\n\n[HÀNH ĐỘNG]: Giới thiệu ngay lập tức hình ảnh, thông số, mô tả. BẮT BUỘC chèn [PRODUCT_WIDGET: [{"id": "MÃ-SP", "reason": "Đúng yêu cầu"}]] vào dòng cuối để khách chuyển sang báo giá.`;
      }

      // 3. Nếu KHÔNG TÌM THẤY sản phẩm/danh mục nào
      const allCategories = await prisma.product_categories.findMany({ take: 3 });
      const listCat = allCategories.map(c => c.category_name).join(", ");
      return `[LỆNH TỪ HỆ THỐNG]: Sản phẩm hoặc danh mục "${args.product_type}" HOÀN TOÀN KHÔNG CÓ trong Database. \n[HÀNH ĐỘNG]: Khéo léo từ chối và gọi ý khách tham khảo các mảng xưởng đang làm mạnh như: ${listCat}.\nCẢNH BÁO NGHIÊM NGẶT: TUYỆT ĐỐI KHÔNG BỊA SẢN PHẨM KHÔNG CÓ TRONG HỆ THỐNG.`;
    } catch (error) {
      console.error("Lỗi DB trong searchProduct:", error);
      return "Lỗi truy xuất cơ sở dữ liệu.";
    }
  },
};
