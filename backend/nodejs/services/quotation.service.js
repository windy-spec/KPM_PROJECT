const prisma = require("../models/prisma");

class QuotationService {
  // 1. LẤY DANH SÁCH BÁO GIÁ (Dành cho Admin/Sale xem tổng quan)
  async getAllQuotations() {
    return await prisma.quotations.findMany({
      include: {
        users: { select: { username: true, email: true } },
      },
      orderBy: { created_at: "desc" },
    });
  }

  // 2. XEM CHI TIẾT 1 BÁO GIÁ (Lôi hết ngóc ngách data ra làm Hóa đơn)
  async getQuotationById(id) {
    const quotation = await prisma.quotations.findUnique({
      where: { id },
      include: {
        users: { select: { username: true, email: true, user_profiles: true } },
        quotation_specs: {
          // Lôi chi tiết bóc tách vật tư
          include: {
            materials: true,
            material_thickness: true,
            paint_types: true,
          },
        },
        quotation_attachments: true, // Lôi danh sách file/bản vẽ đính kèm
        orders: true, // Check xem báo giá này đã biến thành đơn hàng xưởng chưa
      },
    });
    if (!quotation) throw new Error("Không tìm thấy báo giá này!");
    return quotation;
  }

  // 3. CẬP NHẬT TRẠNG THÁI (VD: Từ "draft" sang "approved" hoặc "cancelled")
  async updateStatus(id, status) {
    const validStatuses = ["draft", "approved", "cancelled"];
    if (!validStatuses.includes(status)) {
      throw new Error("Trạng thái không hợp lệ!");
    }

    await this.getQuotationById(id); // Check xem có tồn tại không

    return await prisma.quotations.update({
      where: { id },
      data: { status },
    });
  }

  // 4. THÊM FILE ĐÍNH KÈM (Lưu Link bản vẽ từ FE gửi xuống)
  async addAttachment(quotation_id, data) {
    const { file_name, file_url } = data;
    if (!file_name || !file_url)
      throw new Error("Tên file và URL không được trống!");

    await this.getQuotationById(quotation_id); // Đảm bảo báo giá có thật

    return await prisma.quotation_attachments.create({
      data: {
        quotation_id,
        file_name,
        file_url,
      },
    });
  }

  // 5. XÓA BÁO GIÁ (Cẩn thận khóa ngoại Restrict từ bảng Orders)
  async deleteQuotation(id) {
    await this.getQuotationById(id);

    try {
      // Prisma tự động Cascade: Xóa báo giá là bay luôn specs và attachments
      return await prisma.quotations.delete({ where: { id } });
    } catch (error) {
      if (
        error.code === "P2003" ||
        (error.message && error.message.includes("RESTRICT"))
      ) {
        throw new Error(
          "Không thể xóa Báo giá này vì nó đã được chuyển thành Đơn hàng sản xuất!",
        );
      }
      throw error;
    }
  }
  // CỖ MÁY TÍNH GIÁ HÀNG LOẠT (PRICING ENGINE - BULK CALCULATE)
  async calculateBulk(data) {
    const { user_id, session_id, items } = data; // items là một mảng (Array) các sản phẩm

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("Danh sách sản phẩm trống!");
    }

    let total_quoted_price = 0;
    const quotation_specs_data = [];

    // Lấy đơn giá nhân công mặc định (Ví dụ lấy cái đầu tiên trong DB)
    const laborRate = await prisma.labor_rates.findFirst();
    const labor_price_per_sqm = laborRate
      ? parseFloat(laborRate.rate_amount)
      : 0;

    // Vòng lặp bóc tách từng món trong giỏ hàng
    for (const item of items) {
      const {
        product_id,
        width,
        height,
        material_id,
        thickness_id,
        paint_id,
        note,
      } = item;

      const area = parseFloat(width) * parseFloat(height);

      // Truy vấn DB lấy giá gốc của 3 nguyên liệu
      const [material, thickness, paint] = await Promise.all([
        prisma.materials.findUnique({ where: { id: material_id } }),
        prisma.material_thickness.findUnique({ where: { id: thickness_id } }),
        prisma.paint_types.findUnique({ where: { id: paint_id } }),
      ]);

      if (!material || !thickness || !paint) {
        throw new Error(
          "Vật tư, Độ dày hoặc Loại sơn không tồn tại trong hệ thống!",
        );
      }

      // Công thức lõi
      const material_cost =
        parseFloat(material.base_price) *
        parseFloat(thickness.price_multiplier) *
        area;
      const paint_cost = parseFloat(paint.price_per_sqm) * area;
      const labor_cost = labor_price_per_sqm * area;

      const snapshot_price = material_cost + paint_cost + labor_cost;

      // Cộng dồn vào tổng tiền của cả đơn
      total_quoted_price += snapshot_price;

      // Đẩy vào mảng specs để chuẩn bị lưu DB
      quotation_specs_data.push({
        material_id,
        thickness_id,
        paint_id,
        dimensions: {
          product_id,
          width: parseFloat(width),
          height: parseFloat(height),
          area,
          breakdown_costs: {
            material: material_cost,
            paint: paint_cost,
            labor: labor_cost,
          },
        },
        snapshot_price,
        note,
      });
    }

    // Sau khi tính xong tất cả, tạo 1 Báo Giá duy nhất bao trọn mảng Specs
    return await prisma.quotations.create({
      data: {
        user_id: user_id || null,
        session_id: session_id || null,
        total_quoted_price,
        status: "draft",
        quotation_specs: {
          create: quotation_specs_data,
        },
      },
      include: {
        quotation_specs: true, // Trả về chi tiết để FE hiển thị luôn
      },
    });
  }
  // CỖ MÁY TÍNH GIÁ REAL-TIME CHO FRONTEND (Không lưu DB)
  async calculateRealtime(data) {
    const { product_id, width, height, material_id, thickness_id, paint_id } =
      data;

    if (!width || !height || !material_id || !thickness_id || !paint_id) {
      throw new Error(
        "Vui lòng cung cấp đủ thông số (Kích thước, Vật tư, Độ dày, Sơn)!",
      );
    }

    const area = (parseFloat(width) / 1000) * (parseFloat(height) / 1000); // Đổi mm ra m2

    // Truy vấn song song dữ liệu để tính giá
    const [material, thickness, paint, product, laborRate] = await Promise.all([
      prisma.materials.findUnique({ where: { id: material_id } }),
      prisma.material_thickness.findUnique({ where: { id: thickness_id } }),
      prisma.paint_types.findUnique({ where: { id: paint_id } }),
      product_id
        ? prisma.products.findUnique({ where: { id: product_id } })
        : null,
      prisma.labor_rates.findFirst(), // Lấy đơn giá thợ mặc định
    ]);

    if (!material || !thickness || !paint) {
      throw new Error("Thông số Vật tư, Độ dày hoặc Sơn không hợp lệ!");
    }

    // 1. Tính chi phí lõi
    const material_cost =
      parseFloat(material.base_price) *
      parseFloat(thickness.price_multiplier) *
      area;
    const paint_cost = parseFloat(paint.price_per_sqm) * area;
    const labor_cost = laborRate ? parseFloat(laborRate.rate_amount) * area : 0;

    // 2. Cộng thêm giá tùy chỉnh của chủ xưởng (Cost-plus pricing)
    const price_adjustment =
      product && product.price_adjustment
        ? parseFloat(product.price_adjustment)
        : 0;

    const total_price =
      material_cost + paint_cost + labor_cost + price_adjustment;

    return {
      area: area.toFixed(2),
      breakdown: {
        material_cost,
        paint_cost,
        labor_cost,
        price_adjustment,
      },
      total_price,
    };
  }
  // LƯU CẤU HÌNH YÊU THÍCH CỦA KHÁCH HÀNG (Lưu vào DB với status 'favorite')
  async saveFavorite(data) {
    const {
      user_id,
      title,
      product_id,
      width,
      height,
      material_id,
      thickness_id,
      paint_id,
      note,
    } = data;

    if (!user_id)
      throw new Error("Vui lòng đăng nhập để lưu cấu hình yêu thích!");

    // Tính giá tiền tại thời điểm lưu (Gọi lại hàm calculateRealtime)
    const priceData = await this.calculateRealtime({
      product_id,
      width,
      height,
      material_id,
      thickness_id,
      paint_id,
    });

    // Tạo báo giá với trạng thái favorite
    return await prisma.quotations.create({
      data: {
        user_id,
        title: title || "Cấu hình yêu thích chưa đặt tên",
        total_quoted_price: priceData.total_price,
        status: "favorite",
        quotation_specs: {
          create: [
            {
              material_id,
              thickness_id,
              paint_id,
              dimensions: {
                product_id,
                width: parseFloat(width),
                height: parseFloat(height),
                area: priceData.area,
              },
              snapshot_price: priceData.total_price,
              note,
            },
          ],
        },
      },
      include: { quotation_specs: true },
    });
  }
}
module.exports = new QuotationService();
