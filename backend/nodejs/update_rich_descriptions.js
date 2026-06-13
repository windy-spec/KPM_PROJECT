const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const generateContent = (product) => {
  const name = product.product_name;
  const category = product.product_categories?.category_name || '';
  
  let description = '';

  if (category.includes('Nhà xưởng') || category.includes('Nhà kho')) {
    description = `
<div class="space-y-4">
  <p class="text-[15px] font-medium text-on-surface">
    Chào bác, với kinh nghiệm 15 năm "ăn ngủ" cùng các xưởng cơ khí lớn nhỏ, em khẳng định mẫu <strong class="text-primary">${name}</strong> này là <em>giải pháp tối ưu nhất</em> cho diện tích lưu trữ và sản xuất của bác.
  </p>
  
  <div class="bg-primary/5 p-4 rounded-xl border-l-4 border-primary shadow-sm mt-3">
    <h4 class="font-black text-primary mb-3 text-sm uppercase tracking-wide">🔥 Tại sao nên chọn mẫu này?</h4>
    <ul class="list-none space-y-2 text-sm text-on-surface-variant">
      <li class="flex items-start gap-2">
        <span class="text-primary font-bold">✓</span>
        <span><strong>Kết cấu siêu cứng:</strong> Khung kèo được hàn tổ hợp cực kỳ chắc chắn, bao chịu bão cấp 12, không rung lắc.</span>
      </li>
      <li class="flex items-start gap-2">
        <span class="text-primary font-bold">✓</span>
        <span><strong>Tối ưu không gian:</strong> Thiết kế nhịp khẩu độ lớn, không vướng cột giữa, xe tải ra vào lấy hàng thoải mái.</span>
      </li>
      <li class="flex items-start gap-2">
        <span class="text-primary font-bold">✓</span>
        <span><strong>Làm mát tự nhiên:</strong> Thiết kế thoát nước chuẩn xác và hệ thống đối lưu không khí cực tốt, xưởng luôn thoáng mát kể cả giữa trưa hè.</span>
      </li>
    </ul>
  </div>

  <div class="p-3 bg-surface-container/50 rounded-lg text-sm italic text-on-surface-variant/80 border border-outline-variant/30">
    💡 "Tiến độ lắp ráp thần tốc, giúp bác tiết kiệm tối đa chi phí nhân công và sớm đưa xưởng vào vận hành sinh lời. Liên hệ xưởng em ngay để nhận bản vẽ 3D miễn phí nhé!"
  </div>
</div>`;
  } else if (category.includes('Quán Cafe')) {
    description = `
<div class="space-y-4">
  <p class="text-[15px] font-medium text-on-surface">
    Chào anh/chị, mẫu <strong class="text-primary">${name}</strong> này đang là <span class="bg-[#ff6b00] text-white px-1.5 py-0.5 rounded text-xs font-bold mx-1">HOT TREND</span> cho các mô hình kinh doanh F&B và Homestay hiện đại!
  </p>
  
  <div class="bg-[#ff6b00]/5 p-4 rounded-xl border-l-4 border-[#ff6b00] shadow-sm mt-3">
    <h4 class="font-black text-[#ff6b00] mb-3 text-sm uppercase tracking-wide">☕ Không gian "Cực Chill"</h4>
    <ul class="list-none space-y-2 text-sm text-on-surface-variant">
      <li class="flex items-start gap-2">
        <span class="text-[#ff6b00] font-bold">✓</span>
        <span><strong>Thiết kế mở:</strong> Khung thép lộ thiên kết hợp kính cường lực tạo không gian mở, đón ánh sáng tự nhiên trọn vẹn.</span>
      </li>
      <li class="flex items-start gap-2">
        <span class="text-[#ff6b00] font-bold">✓</span>
        <span><strong>Chi phí thấp:</strong> Tiết kiệm đến 30% chi phí xây dựng so với nhà bê tông cốt thép truyền thống.</span>
      </li>
      <li class="flex items-start gap-2">
        <span class="text-[#ff6b00] font-bold">✓</span>
        <span><strong>Linh hoạt 100%:</strong> Dễ dàng nâng cấp, cơi nới hoặc thậm chí <em>tháo dỡ di dời</em> sang mặt bằng mới mà không vứt bỏ vật tư.</span>
      </li>
    </ul>
  </div>

  <div class="p-3 bg-surface-container/50 rounded-lg text-sm italic text-on-surface-variant/80 border border-outline-variant/30">
    💡 "Khách bước vào check-in nườm nượp là điều em dám chắc. Em nhận thầu trọn gói từ thiết kế đến chìa khóa trao tay!"
  </div>
</div>`;
  } else if (category.includes('Hàng rào')) {
    description = `
<div class="space-y-4">
  <p class="text-[15px] font-medium text-on-surface">
    Nói về bảo vệ mặt tiền nhà thì mẫu <strong class="text-primary">${name}</strong> này là sự lựa chọn số 1. Trộm nhìn thấy cũng phải lắc đầu ngao ngán!
  </p>
  
  <div class="bg-blue-50 p-4 rounded-xl border-l-4 border-blue-500 shadow-sm mt-3">
    <h4 class="font-black text-blue-600 mb-3 text-sm uppercase tracking-wide">🛡️ Vệ sĩ thép cho ngôi nhà</h4>
    <ul class="list-none space-y-2 text-sm text-on-surface-variant">
      <li class="flex items-start gap-2">
        <span class="text-blue-500 font-bold">✓</span>
        <span><strong>Độ bền vĩnh cửu:</strong> Thép hộp dày dặn, các mối hàn được che chắn khí CO2 bao ngấu kín 100%.</span>
      </li>
      <li class="flex items-start gap-2">
        <span class="text-blue-500 font-bold">✓</span>
        <span><strong>Chống rỉ sét:</strong> Qua 2 lớp sơn tĩnh điện kỹ thuật cao, thách thức mọi thời tiết nắng mưa khắc nghiệt.</span>
      </li>
      <li class="flex items-start gap-2">
        <span class="text-blue-500 font-bold">✓</span>
        <span><strong>Thẩm mỹ cao:</strong> Vừa làm lá chắn thép an toàn, vừa tôn lên vẻ bề thế, sang trọng cho kiến trúc tổng thể.</span>
      </li>
    </ul>
  </div>
</div>`;
  } else if (category.includes('Cửa cuốn') || category.includes('Cửa kéo')) {
    description = `
<div class="space-y-4">
  <p class="text-[15px] font-medium text-on-surface">
    Chào anh chị, bộ <strong class="text-primary">${name}</strong> này bên em đã lắp cho hàng ngàn căn nhà phố, ki-ốt và mặt bằng kinh doanh!
  </p>
  
  <div class="bg-teal-50 p-4 rounded-xl border-l-4 border-teal-500 shadow-sm mt-3">
    <h4 class="font-black text-teal-600 mb-3 text-sm uppercase tracking-wide">⚙️ Vận hành siêu êm ái</h4>
    <ul class="list-none space-y-2 text-sm text-on-surface-variant">
      <li class="flex items-start gap-2">
        <span class="text-teal-500 font-bold">✓</span>
        <span><strong>Vật liệu cao cấp:</strong> Nan cửa hợp kim/tôn mạ màu cực kỳ dày dặn, chống cạy phá bằng xà beng.</span>
      </li>
      <li class="flex items-start gap-2">
        <span class="text-teal-500 font-bold">✓</span>
        <span><strong>Triệt tiêu tiếng ồn:</strong> Hệ ray dẫn hướng nhôm có gioăng giảm chấn, đóng mở trơn tru không tiếng cót két.</span>
      </li>
      <li class="flex items-start gap-2">
        <span class="text-teal-500 font-bold">✓</span>
        <span><strong>An toàn tuyệt đối:</strong> Tích hợp công nghệ đảo chiều khi gặp vật cản, bảo vệ trẻ nhỏ và thú cưng.</span>
      </li>
    </ul>
  </div>
</div>`;
  } else if (category.includes('Cửa sắt') || category.includes('Cửa nhôm') || category.includes('Cửa')) {
    description = `
<div class="space-y-4">
  <p class="text-[15px] font-medium text-on-surface">
    <strong class="text-primary">${name}</strong> là dòng sản phẩm chủ lực, mang đậm dấu ấn chế tác thủ công tinh xảo của xưởng KPM.
  </p>
  
  <div class="bg-indigo-50 p-4 rounded-xl border-l-4 border-indigo-500 shadow-sm mt-3">
    <h4 class="font-black text-indigo-600 mb-3 text-sm uppercase tracking-wide">✨ Đẹp từng centimet</h4>
    <ul class="list-none space-y-2 text-sm text-on-surface-variant">
      <li class="flex items-start gap-2">
        <span class="text-indigo-500 font-bold">✓</span>
        <span><strong>Cơ khí chính xác:</strong> Khung bao vững chãi, cắt CNC góc nối mượt mà không hở một nan li.</span>
      </li>
      <li class="flex items-start gap-2">
        <span class="text-indigo-500 font-bold">✓</span>
        <span><strong>Phụ kiện đồng bộ:</strong> Sử dụng bản lề cối tiện loại xịn, đóng mở 10 năm không lo xệ cánh.</span>
      </li>
      <li class="flex items-start gap-2">
        <span class="text-indigo-500 font-bold">✓</span>
        <span><strong>Cách âm cách nhiệt:</strong> Hệ gioăng cao su EPDM viền quanh khung bao, đóng cửa lại là tách biệt với thế giới bên ngoài.</span>
      </li>
    </ul>
  </div>
</div>`;
  } else if (category.includes('Mái')) {
    description = `
<div class="space-y-4">
  <p class="text-[15px] font-medium text-on-surface">
    Anh chị đang tìm giải pháp che chắn hiệu quả? <strong class="text-primary">${name}</strong> chính là lựa chọn "che mưa gọi gió" hoàn hảo nhất.
  </p>
  
  <div class="bg-cyan-50 p-4 rounded-xl border-l-4 border-cyan-500 shadow-sm mt-3">
    <h4 class="font-black text-cyan-600 mb-3 text-sm uppercase tracking-wide">🌧️ Thách thức thời tiết</h4>
    <ul class="list-none space-y-2 text-sm text-on-surface-variant">
      <li class="flex items-start gap-2">
        <span class="text-cyan-500 font-bold">✓</span>
        <span><strong>Kết cấu vững vàng:</strong> Khung kèo thép I hoặc V được tính toán tải trọng kỹ lưỡng, bất chấp cuồng phong giông lốc.</span>
      </li>
      <li class="flex items-start gap-2">
        <span class="text-cyan-500 font-bold">✓</span>
        <span><strong>Hoàn thiện chống thấm:</strong> Từng vị trí bắn vít đều được chít keo silicon chuyên dụng, cam kết 100% không nhỏ giọt.</span>
      </li>
      <li class="flex items-start gap-2">
        <span class="text-cyan-500 font-bold">✓</span>
        <span><strong>Thoát nước siêu tốc:</strong> Độ dốc tiêu chuẩn kết hợp hệ máng xối cỡ lớn, mưa lớn đến mấy cũng trôi tuột!</span>
      </li>
    </ul>
  </div>
</div>`;
  } else if (category.includes('Bàn') || category.includes('Ghế') || category.includes('Kệ')) {
    description = `
<div class="space-y-4">
  <p class="text-[15px] font-medium text-on-surface">
    Chào bạn, mẫu <strong class="text-primary">${name}</strong> với thiết kế khung thép tĩnh điện phối gỗ mộc mạc đang là "best-seller" bên mình!
  </p>
  
  <div class="bg-emerald-50 p-4 rounded-xl border-l-4 border-emerald-500 shadow-sm mt-3">
    <h4 class="font-black text-emerald-600 mb-3 text-sm uppercase tracking-wide">🌿 Phong cách Tối giản</h4>
    <ul class="list-none space-y-2 text-sm text-on-surface-variant">
      <li class="flex items-start gap-2">
        <span class="text-emerald-500 font-bold">✓</span>
        <span><strong>Thiết kế tinh tế:</strong> Phù hợp Decor cho mọi không gian từ góc làm việc cá nhân đến văn phòng, tiệm cafe.</span>
      </li>
      <li class="flex items-start gap-2">
        <span class="text-emerald-500 font-bold">✓</span>
        <span><strong>Tải trọng khủng:</strong> Khung sắt hộp hàn nguyên khối cực kỳ đầm chắc, chịu lực lên tới 150kg mà không rung lắc.</span>
      </li>
      <li class="flex items-start gap-2">
        <span class="text-emerald-500 font-bold">✓</span>
        <span><strong>Độ hoàn thiện cao:</strong> Các góc cạnh gỗ được bo tròn mịn màng, chân đế có bọc cao su chống xước sàn nhà tuyệt đối.</span>
      </li>
    </ul>
  </div>
</div>`;
  } else {
    description = `
<div class="space-y-3">
  <p class="text-sm text-on-surface-variant leading-relaxed">
    <strong class="text-primary text-base">${name}</strong> được gia công trực tiếp tại xưởng với quy trình kiểm định chất lượng khắt khe nhất.
  </p>
  <ul class="list-disc pl-5 space-y-1 text-sm text-on-surface-variant">
    <li>Vật tư xuất xứ rõ ràng, CO/CQ đầy đủ.</li>
    <li>Đội ngũ thợ cơ khí lành nghề, tỉ mỉ trong từng đường cắt, mối hàn.</li>
    <li>Cam kết mang lại độ bền cao, tính thẩm mỹ vượt trội với giá tại xưởng (Không qua trung gian).</li>
  </ul>
</div>`;
  }

  return description;
};

async function updateProducts() {
  try {
    const products = await prisma.products.findMany({
      include: { product_categories: true }
    });

    console.log(`Found ${products.length} products to update with HTML descriptions.`);

    for (const prod of products) {
      const richHtml = generateContent(prod);
      await prisma.products.update({
        where: { id: prod.id },
        data: { description: richHtml }
      });
    }

    console.log("Successfully applied beautiful HTML descriptions to all products!");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

updateProducts();
