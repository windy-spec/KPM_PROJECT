const ExcelJS = require('exceljs');
const path = require('path');

async function updateTemplate() {
  const filePath = path.join(__dirname, 'templates', 'KPM_Import_Product.xlsx');
  console.log("Đọc file:", filePath);
  
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  
  const worksheet = workbook.worksheets[0];
  
  // Chúng ta sẽ chèn cột "Giá bán gốc" vào Cột G (sau Cột F: Thành phần cấu tạo)
  // Các cột hiện tại:
  // F: Thành phần cấu tạo
  // G: Điều chỉnh giá
  // H: Ảnh chính
  // I: Ảnh phụ
  
  // Chèn 1 cột trống vào vị trí G
  worksheet.spliceColumns(7, 0, []); 
  
  // Sửa tiêu đề cột G
  const cellG4 = worksheet.getCell('G4');
  cellG4.value = "Giá bán gốc";
  cellG4.font = { bold: true, color: { argb: "FFFFFF" } };
  cellG4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: "0070C0" } };
  worksheet.getColumn('G').width = 20;

  // Cập nhật lại các màu sắc và độ rộng cột cho đẹp
  worksheet.getColumn('H').width = 20; // Điều chỉnh giá
  worksheet.getColumn('I').width = 30; // Ảnh chính
  worksheet.getColumn('J').width = 30; // Ảnh phụ

  await workbook.xlsx.writeFile(filePath);
  console.log("Đã cập nhật file mẫu Excel thành công!");
}

updateTemplate().catch(console.error);
