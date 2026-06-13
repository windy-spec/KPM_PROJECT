const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const generateContent = (product) => {
  const name = product.product_name;
  const category = product.product_categories?.category_name || '';
  
  let description = '';
  let specs = {};

  if (category.includes('Nhà xưởng') || category.includes('Nhà kho')) {
    description = `Chào bác, với kinh nghiệm 15 năm làm xưởng cơ khí, em khẳng định mẫu ${name} này là giải pháp tối ưu nhất cho diện tích rộng. Khung kèo được hàn tổ hợp cực kỳ chắc chắn, bao chịu bão cấp 12. Tiến độ lắp ráp siêu nhanh, giúp bác tiết kiệm tối đa thời gian đưa vào vận hành. Thiết kế thoát nước và đối lưu không khí cực tốt, đảm bảo xưởng luôn thoáng mát.`;
    specs = {
      "Kết cấu móng": "Móng đơn/móng băng bê tông cốt thép",
      "Khung cột": "Thép tổ hợp chữ I/H mạ kẽm",
      "Vách bao che": "Tôn lạnh 0.45mm / Panel EPS 50mm cách nhiệt",
      "Mái lợp": "Tôn chống nóng 3 lớp",
      "Thời gian thi công": "15 - 30 ngày tùy diện tích",
      "Bảo hành": "Bảo hành kết cấu 10 năm"
    };
  } else if (category.includes('Quán Cafe')) {
    description = `Chào anh/chị, mẫu ${name} này đang là 'hot trend' cho các mô hình kinh doanh F&B hiện đại. Với kết cấu khung thép lộ thiên kết hợp kính cường lực, quán của anh chị sẽ có không gian mở, đón ánh sáng tự nhiên cực chill. Vừa tiết kiệm chi phí xây dựng, vừa dễ dàng tháo dỡ hoặc mở rộng sau này. Em cam kết làm xong khách đến nườm nượp!`;
    specs = {
      "Phong cách": "Industrial / Hiện đại / Mở",
      "Khung chịu lực": "Thép hộp mạ kẽm / Thép chữ I sơn tĩnh điện",
      "Vật liệu sàn": "Tấm Cemboard chịu lực / Decking",
      "Vật liệu ốp": "Kính cường lực 10mm / Gỗ nhựa ngoài trời",
      "Thời gian thi công": "10 - 20 ngày",
      "Khả năng di dời": "Tháo lắp di dời dễ dàng tái sử dụng 90%"
    };
  } else if (category.includes('Hàng rào')) {
    description = `Chào bạn, nói về bảo vệ mặt tiền thì mẫu ${name} này là số 1. Em sử dụng thép dày, mối hàn kín 100% kết hợp sơn tĩnh điện chống rỉ sét tuyệt đối. Không chỉ chống trộm siêu an toàn mà thiết kế còn cực kỳ bắt mắt, tôn lên vẻ bề thế cho ngôi nhà của bạn. Lắp bộ này vào thì trộm nhìn thấy cũng phải lắc đầu ngao ngán!`;
    specs = {
      "Vật liệu chính": "Thép hộp mạ kẽm / Sắt đặc / Inox 304",
      "Công nghệ hàn": "Hàn MIG che chắn khí CO2 bao ngấu",
      "Xử lý bề mặt": "Sơn tĩnh điện chống ăn mòn 2 lớp",
      "Chiều cao tiêu chuẩn": "1.8m - 2.5m (Có thể tùy chỉnh)",
      "Độ bền màu": "5 - 7 năm ngoài trời",
      "Bảo hành": "24 tháng chống rỉ sét"
    };
  } else if (category.includes('Cửa cuốn') || category.includes('Cửa kéo')) {
    description = `Chào anh chị, bộ ${name} này em lắp cho không biết bao nhiêu nhà mặt phố rồi. Trục cuốn siêu êm, nan cửa dày dặn chống cạy phá. Hoạt động trơn tru không tiếng ồn. Đặc biệt em bảo hành motor dài hạn cho anh chị yên tâm sử dụng. An toàn, tiện lợi và tiết kiệm diện tích tối đa!`;
    specs = {
      "Vật liệu nan": "Hợp kim nhôm 6063-T5 / Tôn mạ màu",
      "Độ dày nan": "0.6mm - 1.4mm",
      "Ray dẫn hướng": "Nhôm hợp kim có gioăng giảm chấn",
      "Trục cuốn": "Thép mạ kẽm Φ114",
      "Tích hợp an toàn": "Tự dừng khi gặp vật cản / Còi báo động",
      "Bảo hành motor": "24 tháng"
    };
  } else if (category.includes('Cửa sắt') || category.includes('Cửa nhôm') || category.includes('Cửa')) {
    description = `Mẫu ${name} này là dòng sản phẩm chủ lực bên xưởng em. Khung bao chắc chắn, góc cắt CNC chuẩn xác không hở khe. Bản lề loại xịn chống xệ cánh tuyệt đối. Sơn tĩnh điện siêu bền bỉ thách thức nắng mưa. Dùng 10 năm mở vẫn nhẹ nhàng êm ái, đảm bảo anh chị nhìn là ưng cái bụng!`;
    specs = {
      "Vật liệu khung": "Nhôm Xingfa nhập khẩu / Sắt hộp mạ kẽm",
      "Độ dày khung": "1.4mm - 2.0mm",
      "Loại kính": "Kính cường lực 8mm / 10mm",
      "Phụ kiện": "Kinlong đồng bộ / Bản lề cối chịu lực",
      "Gioăng cao su": "Hệ gioăng kép EPDM cách âm cách nhiệt",
      "Bảo hành": "12 tháng phụ kiện, 5 năm màu sơn"
    };
  } else if (category.includes('Mái')) {
    description = `Anh chị đang cần làm mái che thì mẫu ${name} là lựa chọn hoàn hảo. Xưởng em thiết kế độ dốc chuẩn, hệ khung kèo cứng cáp bất chấp gió giật. Vật liệu lợp lấy sáng tốt hoặc chống nóng cực êm. Thi công nhanh gọn, keo silicon chít kỹ càng đảm bảo 100% không dột một giọt nước nào vào nhà!`;
    specs = {
      "Khung đỡ": "Thép hộp mạ kẽm / Thép chữ I",
      "Vật liệu lợp": "Tôn lạnh 3 lớp / Kính cường lực / Polycarbonate",
      "Độ dốc tiêu chuẩn": "10% - 15% thoát nước nhanh",
      "Phụ kiện kèm theo": "Máng xối Inox 304 / Nhôm",
      "Khả năng chịu lực": "Chịu gió bão cấp 10",
      "Bảo hành": "Bảo hành dột 36 tháng"
    };
  } else if (category.includes('Bàn') || category.includes('Ghế') || category.includes('Kệ')) {
    description = `Chào bạn, mẫu ${name} với thiết kế khung sắt tĩnh điện phối gỗ đang là mặt hàng siêu cháy bên em. Vừa mang phong cách hiện đại, tối giản vừa cực kỳ bền bỉ. Chịu tải trọng tốt, các góc cạnh được mài nhẵn an toàn tuyệt đối. Thích hợp cho cả không gian gia đình lẫn quán cafe, văn phòng. Mua một lần xài cả đời!`;
    specs = {
      "Khung chịu lực": "Sắt hộp mạ kẽm 25x25 / 30x30",
      "Vật liệu mặt": "Gỗ cao su ghép thanh / MDF chống ẩm",
      "Xử lý bề mặt": "Sơn tĩnh điện chống trầy xước",
      "Chịu tải trọng": "Lên đến 150kg",
      "Đế chân": "Nút cao su chống trượt & xước sàn",
      "Bảo hành": "12 tháng kết cấu"
    };
  } else {
    description = `Mẫu ${name} được gia công trực tiếp tại xưởng với quy trình kiểm định khắt khe. Vật tư xuất xứ rõ ràng, thợ lành nghề thi công tỉ mỉ từng mối hàn. Sản phẩm đạt độ bền cao, tính thẩm mỹ tốt và giá cả cực kỳ cạnh tranh. Em tự tin bao chất lượng toàn thị trường cho bác!`;
    specs = {
      "Vật liệu": "Tiêu chuẩn loại 1 nhập nhà máy",
      "Kỹ thuật thi công": "Cắt mài CNC, hàn tự động",
      "Bảo hành": "12 tháng",
      "Xuất xứ": "Xưởng cơ khí KPM"
    };
  }

  return { description, specs };
};

async function updateProducts() {
  try {
    const products = await prisma.products.findMany({
      include: { product_categories: true }
    });

    console.log(`Found ${products.length} products to update.`);

    for (const prod of products) {
      const { description, specs } = generateContent(prod);

      // Merge with existing specs if they exist, but generated ones take precedence
      const existingSpecs = typeof prod.default_specs === 'object' && prod.default_specs !== null 
        ? prod.default_specs 
        : {};
      
      const newSpecs = { ...existingSpecs, ...specs };

      await prisma.products.update({
        where: { id: prod.id },
        data: {
          description: description,
          default_specs: newSpecs
        }
      });
    }

    console.log("Successfully updated all product descriptions and specs!");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

updateProducts();
