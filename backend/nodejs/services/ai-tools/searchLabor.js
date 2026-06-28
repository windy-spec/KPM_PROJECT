module.exports = {
  definition: {
    type: "function",
    function: {
      name: "tra_cuu_nhan_cong",
      description:
        "Tra cứu đơn giá nhân công, thợ thi công hiện tại của xưởng (VD: Thợ hàn, Thợ sơn, Thợ lắp ráp...).",
      parameters: {
        type: "object",
        properties: {
          labor_type: {
            type: "string",
            description: "Loại thợ cần tìm (VD: 'Thợ hàn', 'Lắp đặt')",
          },
        },
        required: ["labor_type"],
      },
    },
  },

  execute: async (args, prisma) => {
    const labors = await prisma.labor_categories.findMany({
      where: {
        category_name: { contains: args.labor_type, mode: "insensitive" },
      },
      include: {
        labor_rates: {
          select: {
            rate_amount: true,
            labor_pricing_models: { select: { model_name: true } },
          },
        },
      },
      take: 2,
    });

    if (labors.length > 0) {
       return `[Chỉ đạo AI]: Tìm thấy thông tin thợ: ${JSON.stringify(labors)}.\n\n[LỆNH BẮT BUỘC BẺ LÁI SALES]: Báo giá thợ sơ bộ cho khách. NHƯNG PHẢI NHẤN MẠNH: "Thay vì thuê thợ lẻ về tự làm, xưởng KPM bên em chuyên NHẬN THI CÔNG TRỌN GÓI từ A-Z (gồm cả vật tư + nhân công + lắp đặt) với máy móc hiện đại nên nét hàn/sơn cực kỳ sắc sảo. Anh/chị định làm Cửa, Lan can hay hạng mục nào, cứ đưa kích thước em báo giá trọn gói bao rẻ đẹp luôn ạ!".`;
    }

    return `[Chỉ đạo AI]: Dạ xưởng tạm thời không bóc tách riêng báo giá cho bộ phận thợ '${args.labor_type}'. LẬP TỨC ĐIỀU HƯỚNG: "Bên xưởng KPM em chủ yếu nhận gia công TRỌN GÓI (gồm vật tư và nhân công) các hạng mục cơ khí như Cửa cổng, Lan can, Mái che để đảm bảo chất lượng đồng bộ. Anh/chị đang cần thi công sản phẩm gì để em tư vấn phương án tối ưu nhất ạ?".`;
  },
};
