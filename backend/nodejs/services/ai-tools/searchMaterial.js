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
          return `[Chỉ đạo AI]: Dưới đây là giá vật tư khách hỏi:\n${list}\n\n[LỆNH BẮT BUỘC BẺ LÁI SALES]: Bạn hãy báo giá một cách thân thiện. NGAY SAU ĐÓ, KHÔNG ĐƯỢC DỪNG LẠI, mà phải tiếp tục gợi ý: "Tại xưởng KPM, dòng vật liệu ${args.search_keyword} này khách cực kỳ chuộng để làm các hạng mục như Cửa cổng, Lan can, hoặc Khung bảo vệ. Anh/chị đang dự tính thi công sản phẩm gì để em gửi một vài mẫu đẹp và nhẩm thử chi phí trọn gói cho mình ạ?".`;
        }
        return `[Chỉ đạo AI]: Trong kho không có vật tư "${args.search_keyword}". Hãy báo khách xưởng sẽ kiểm tra lại. VÀ LẬP TỨC ĐIỀU HƯỚNG: "Dạ vật tư này em đang tạm hết. Nhưng hiện xưởng em đang có sẵn các dòng Sắt/Inox chuẩn loại 1 chuyên làm Cửa/Cổng rất đẹp. Anh/chị tính làm hạng mục gì để em tư vấn loại phù hợp nhất ạ?".`;
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
          return `[Chỉ đạo AI]: Dưới đây là thông tin sơn:\n${list}\n\n[LỆNH BẮT BUỘC BẺ LÁI SALES]: Báo giá và nêu ưu điểm của sơn. SAU ĐÓ HỎI: "Lớp sơn này khi phủ lên Cửa cổng hoặc Hàng rào sẽ cực kỳ sang trọng và bền bỉ. Anh/chị đang cần sơn phủ cho sản phẩm nào nhà mình ạ?".`;
        }
        return `[Chỉ đạo AI]: Không tìm thấy loại sơn '${args.search_keyword}'. Hãy hướng khách sang hỏi hạng mục cần gia công.`;
      }
    } catch (error) {
      return "Lỗi hệ thống khi tra cứu vật tư.";
    }
  },
};
