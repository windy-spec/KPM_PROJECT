const prisma = require("../models/prisma");

class QuotationService {
  // ==========================================
  // LÕI TÍNH GIÁ: BÓC TÁCH VÀ TẠO BÁO GIÁ
  // ==========================================
  async calculateAndCreateQuotation(payload) {
    const {
      user_id,
      session_id,
      product_id, // Truyền vào để biết khách chọn mẫu nào
      width,
      height,
      material_id,
      thickness_id,
      paint_id,
      note,
    } = payload;

    // BƯỚC 1: TÍNH DIỆN TÍCH (Area)
    if (!width || !height || width <= 0 || height <= 0) {
      throw new Error("Kích thước chiều rộng và chiều cao phải lớn hơn 0!");
    }
    const area = parseFloat(width) * parseFloat(height);

    // BƯỚC 2: BÓC TÁCH TIỀN VẬT TƯ (Material)
    if (!material_id) throw new Error("Bắt buộc phải chọn Vật tư!");

    const material = await prisma.materials.findUnique({
      where: { id: material_id },
    });
    if (!material) throw new Error("Không tìm thấy vật tư trong hệ thống!");

    let multiplier = 1.0;
    if (thickness_id) {
      const thickness = await prisma.material_thickness.findUnique({
        where: { id: thickness_id },
      });
      if (!thickness || thickness.material_id !== material_id) {
        throw new Error("Độ dày này không khớp với vật tư đã chọn!");
      }
      multiplier = parseFloat(thickness.price_multiplier);
    }
    // Công thức: Diện tích x Giá gốc x Hệ số độ dày
    const materialCost = area * parseFloat(material.base_price) * multiplier;

    // BƯỚC 3: BÓC TÁCH TIỀN SƠN (Paint) - Tùy chọn có hoặc không
    let paintCost = 0;
    if (paint_id) {
      const paint = await prisma.paint_types.findUnique({
        where: { id: paint_id },
      });
      if (!paint) throw new Error("Không tìm thấy loại sơn trong hệ thống!");
      paintCost = area * parseFloat(paint.price_per_sqm);
    }

    // BƯỚC 4: BÓC TÁCH TIỀN NHÂN CÔNG (Labor)
    // Để đơn giản, ta lấy 1 mức giá nhân công chung (hoặc sau này bro có thể truyền labor_rate_id vào)
    let laborCost = 0;
    const laborRate = await prisma.labor_rates.findFirst();
    if (laborRate) {
      laborCost = area * parseFloat(laborRate.rate_amount);
    }

    // BƯỚC 5: TỔNG HỢP VÀ CHỐT GIÁ (Snapshot Price)
    const totalSnapshotPrice = materialCost + paintCost + laborCost;

    // XÀI TRANSACTION ĐỂ LƯU ĐỒNG THỜI VÀO 2 BẢNG QUOTATION VÀ QUOTATION_SPECS
    return await prisma.$transaction(async (tx) => {
      // 1. Tạo Báo giá tổng (Vỏ bọc ngoài)
      const newQuotation = await tx.quotations.create({
        data: {
          user_id: user_id || null,
          session_id: session_id || null,
          total_quoted_price: totalSnapshotPrice,
          status: "draft", // Vừa tính ra thì ở trạng thái Nháp
        },
      });

      // 2. Nhét các thông tin bóc tách vào JSON để linh hoạt lưu trữ
      const dimensionsJson = {
        product_id: product_id || null,
        width: parseFloat(width),
        height: parseFloat(height),
        area: area,
        breakdown_costs: {
          material: materialCost,
          paint: paintCost,
          labor: laborCost,
        },
      };

      // 3. Tạo Chi tiết báo giá (Lưu vết Snapshot)
      await tx.quotation_specs.create({
        data: {
          quotation_id: newQuotation.id,
          material_id: material_id,
          thickness_id: thickness_id || null,
          paint_id: paint_id || null,
          dimensions: dimensionsJson, // JSON cân mọi loại dữ liệu
          snapshot_price: totalSnapshotPrice, // CHỐT CỨNG GIÁ TẠI ĐÂY
          note: note || null,
        },
      });

      // Trả kết quả mượt mà ra cho Controller
      return {
        quotation_id: newQuotation.id,
        status: "draft",
        specs: dimensionsJson,
        total_price: totalSnapshotPrice,
      };
    });
  }
}

module.exports = new QuotationService();
