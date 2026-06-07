const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Bắt đầu nạp dữ liệu nhân công...");

  // 1. Nạp Categories
  const catPhu = await prisma.labor_categories.create({
    data: { category_name: "Thợ phụ", description: "Hỗ trợ, cắt sắt" },
  });
  const catChinh = await prisma.labor_categories.create({
    data: { category_name: "Thợ chính", description: "Thợ đứng máy, lắp đặt" },
  });
  const catGioi = await prisma.labor_categories.create({
    data: { category_name: "Thợ giỏi", description: "Chuyên gia kỹ thuật" },
  });

  // 2. Nạp Models
  const modNgay = await prisma.labor_pricing_models.create({
    data: { model_name: "Làm theo ngày" },
  });
  const modSP = await prisma.labor_pricing_models.create({
    data: { model_name: "Ăn theo sản phẩm" },
  });
  const modKhoan = await prisma.labor_pricing_models.create({
    data: { model_name: "Làm khoán" },
  });

  // 3. Nạp Rates
  const rates = [
    { cat: catPhu, mod: modNgay, price: 400000 },
    { cat: catPhu, mod: modSP, price: 425000 },
    { cat: catPhu, mod: modKhoan, price: 450000 },
    { cat: catChinh, mod: modNgay, price: 600000 },
    { cat: catChinh, mod: modSP, price: 650000 },
    { cat: catChinh, mod: modKhoan, price: 700000 },
    { cat: catGioi, mod: modNgay, price: 1000000 },
    { cat: catGioi, mod: modSP, price: 1100000 },
    { cat: catGioi, mod: modKhoan, price: 1200000 },
  ];

  for (const r of rates) {
    await prisma.labor_rates.create({
      data: {
        category_id: r.cat.id,
        model_id: r.mod.id,
        rate_amount: r.price,
      },
    });
  }

  console.log("✅ Nạp dữ liệu thành công!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
