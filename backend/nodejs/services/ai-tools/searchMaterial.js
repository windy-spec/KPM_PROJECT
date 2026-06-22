module.exports = {
  definition: {
    type: "function",
    function: {
      name: "tra_cuu_vat_tu",
      description:
        "Tra cứu giá, ưu điểm và thông tin vật tư (Sắt, Inox...) hoặc Sơn.",
      parameters: {
        type: "object",
        properties: {
          search_keyword: { type: "string" },
          category: { type: "string", enum: ["material", "paint"] },
        },
        required: ["search_keyword", "category"],
      },
    },
  },

  execute: async (args, prisma) => {
    try {
      if (args.category === "material") {
        const materials = await prisma.materials.findMany({
          where: {
            material_name: {
              contains: args.search_keyword,
              mode: "insensitive",
            },
          },
          take: 3,
          select: {
            material_code: true,
            material_name: true,
            base_price: true,
          },
        });

        if (materials.length > 0) {
          const list = materials
            .map(
              (m) =>
                `- ${m.material_name}: ${m.base_price ? m.base_price.toLocaleString("vi-VN") + "đ" : "Đang cập nhật"}`,
            )
            .join("\n");
          return `[Chỉ đạo AI]: Dưới đây là giá vật tư khách hỏi:\n${list}\nHãy báo giá cho khách một cách thân thiện, sau đó hỏi khách dự định dùng vật tư này cho hạng mục nào (cửa, cổng, lan can...) để tư vấn thêm.`;
        }
        return `[Chỉ đạo AI]: Trong kho không có vật tư "${args.search_keyword}". Hãy báo khách xưởng sẽ kiểm tra lại với nhà cung cấp hoặc gợi ý vật tư khác tương tự.`;
      }

      if (args.category === "paint") {
        const paints = await prisma.paint_types.findMany({
          where: {
            paint_name: { contains: args.search_keyword, mode: "insensitive" },
          },
          take: 3,
          select: { paint_name: true, price_per_sqm: true },
        });

        if (paints.length > 0) {
          const list = paints
            .map(
              (p) =>
                `- ${p.paint_name}: ${p.price_per_sqm ? p.price_per_sqm.toLocaleString("vi-VN") + "đ/m2" : "Đang cập nhật"}`,
            )
            .join("\n");
          return `[Chỉ đạo AI]: Dưới đây là thông tin sơn:\n${list}\nHãy báo giá và nêu ưu điểm của loại sơn này (như chống trầy, bền màu).`;
        }
        return `[Chỉ đạo AI]: Không tìm thấy loại sơn '${args.search_keyword}'.`;
      }
    } catch (error) {
      return "Lỗi hệ thống khi tra cứu vật tư.";
    }
  },
};
