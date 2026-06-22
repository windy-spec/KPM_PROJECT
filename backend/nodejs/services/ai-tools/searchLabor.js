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

    return labors.length > 0
      ? JSON.stringify(labors)
      : `Dạ xưởng tạm thời không có thông tin báo giá cho bộ phận thợ '${args.labor_type}'.`;
  },
};
