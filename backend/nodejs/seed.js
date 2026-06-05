const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const categoriesData = [
  // Nhóm Cửa & Cổng (CUA)
  { category_code: "DM-CUA-C2C", category_name: "Cửa cổng sắt 2 cánh", description: "Cổng mở quay 2 cánh" },
  { category_code: "DM-CUA-C4C", category_name: "Cửa cổng sắt 4 cánh", description: "Cổng xếp gấp 4 cánh" },
  { category_code: "DM-CUA-LUA", category_name: "Cửa cổng lùa / trượt", description: "Cổng lùa ngang" },
  { category_code: "DM-CUA-KDL", category_name: "Cửa kéo Đài Loan", description: "Cửa kéo có lá hoặc không lá" },
  { category_code: "DM-CUA-CUON", category_name: "Cửa cuốn", description: "Cửa cuốn khe thoáng, tấm liền" },
  { category_code: "DM-CUA-DI", category_name: "Cửa đi sắt kính", description: "Cửa phòng, cửa chính pano kính" },

  // Nhóm Hàng rào (HR)
  { category_code: "DM-HR-CNC", category_name: "Hàng rào cắt CNC", description: "Thép tấm cắt laser/plasma" },
  { category_code: "DM-HR-SMT", category_name: "Hàng rào sắt mỹ thuật", description: "Rèn, uốn thủ công, bông gang" },
  { category_code: "DM-HR-CHONG", category_name: "Hàng rào chông", description: "Chông chống trộm 3 chĩa, chông lá" },
  { category_code: "DM-HR-THEP", category_name: "Hàng rào lưới thép", description: "Lưới B40, rào thép hàn công trình" },

  // Nhóm Lan can & Ban công (LC)
  { category_code: "DM-LC-BC", category_name: "Lan can ban công sắt", description: "Ban công sắt hộp, uốn mỹ thuật" },
  { category_code: "DM-LC-CNC", category_name: "Lan can ban công CNC", description: "Lan can thép tấm cắt hoa văn" },

  // Nhóm Cửa sổ (CS)
  { category_code: "DM-CS-MO", category_name: "Cửa sổ sắt", description: "Khung cánh cửa sổ mở quay/lùa" },
  { category_code: "DM-CS-BV", category_name: "Khung bảo vệ cửa sổ", description: "Song sắt, hoa sắt chống trộm" },
  { category_code: "DM-CS-GIENG", category_name: "Khung bảo vệ giếng trời", description: "Khung lấy sáng, lưới giếng trời" },

  // Nhóm Cầu thang (CT)
  { category_code: "DM-CT-BO", category_name: "Cầu thang sắt nguyên bộ", description: "Cầu thang xoắn, xương cá" },
  { category_code: "DM-CT-LC", category_name: "Lan can tay vịn cầu thang", description: "Lan can sắt uốn, tay vịn gỗ/sắt" },

  // Nhóm Nội thất (NT)
  { category_code: "DM-NT-BAN", category_name: "Bàn khung sắt", description: "Bàn trà, bàn ăn, bàn làm việc" },
  { category_code: "DM-NT-GHE", category_name: "Ghế sắt nghệ thuật", description: "Ghế cafe, xích đu, ghế công viên" },
  { category_code: "DM-NT-GIUONG", category_name: "Giường sắt", description: "Giường sắt rèn, giường hộp" },

  // Nhóm Gia dụng & Phụ kiện (GD / PK)
{ category_code: "DM-GD-KE", category_name: "Kệ sắt trang trí", description: "Kệ tivi, kệ sách, kệ trồng cây" },
  { category_code: "DM-GD-MOC", category_name: "Móc treo / Giá đỡ", description: "Móc treo quần áo, giá đỡ chậu hoa" },
  { category_code: "DM-PK-DUC", category_name: "Phụ kiện sắt đúc", description: "Bông gang, chông đúc, lá sắt lẻ" },
  { category_code: "DM-PK-MAI", category_name: "Mái che / Mái hiên", description: "Khung mái kính, poly lấy sáng" }
];

async function main() {
  console.log("⏳ Đang nạp 24 Danh mục vào Database...");
  
  // Dùng createMany với skipDuplicates để nếu chạy lại file này 2 lần cũng không bị lỗi trùng lặp
  const result = await prisma.product_categories.createMany({
    data: categoriesData,
    skipDuplicates: true, 
  });

  console.log(`✅ Thành công! Đã nạp ${result.count} danh mục mới.`);
}

main()
  .catch((e) => {
    console.error("❌ Lỗi khi nạp dữ liệu:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });