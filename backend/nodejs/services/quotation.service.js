const prisma = require("../models/prisma");
const { sendQuotationEmail, sendOrderConfirmationEmail } = require("../utils/mailer.utils");

class QuotationService {
  // 1. LẤY DANH SÁCH BÁO GIÁ (Dành cho Admin/Sale xem tổng quan)
  async getAllQuotations() {
    return await prisma.quotations.findMany({
      include: {
        users: { select: { username: true, email: true } },
        // Thêm đoạn này để kéo luôn thông số vật tư ra cho danh sách
        quotation_specs: {
          include: {
            materials: true,
            material_thickness: true,
            paint_types: true,
          },
        },
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
    const validStatuses = ["draft", "pending_admin", "sent_to_customer", "approved", "customer_approved", "admin_confirmed", "rejected", "cancelled", "favorite"];
    if (!validStatuses.includes(status)) {
      throw new Error("Trạng thái không hợp lệ!");
    }

    const quotation = await this.getQuotationById(id);

    const updatedQuotation = await prisma.quotations.update({
      where: { id },
      data: { status },
      include: { users: true }
    });

    // Nếu Admin xác nhận lên đơn hàng -> Sinh ra Order và gửi email cho Khách hàng
    if (status === "admin_confirmed") {
      try {
        // Tạo mã đơn hàng ngẫu nhiên
        const orderCode = "ORD-" + Math.floor(1000 + Math.random() * 9000) + "-" + new Date().getFullYear();
        
        const newOrder = await prisma.orders.create({
          data: {
            quotation_id: id,
            order_code: orderCode,
            production_status: "confirmed"
          }
        });

        // Gửi email báo khách hàng đơn đã được lên thành công
        if (updatedQuotation.users && updatedQuotation.users.email) {
          await sendOrderConfirmationEmail(updatedQuotation.users.email, newOrder, updatedQuotation);
        }
      } catch (err) {
        console.error("Lỗi khi tạo Đơn hàng hoặc gửi email:", err);
      }
    }

    return updatedQuotation;
  }

  // 3.1 GỬI YÊU CẦU BÁO GIÁ (Khách hàng tạo request mới)
  async requestCustomQuote(data) {
    const { user_id, title, product_id, components, note } = data;

    if (!user_id) throw new Error("Vui lòng đăng nhập để gửi yêu cầu báo giá!");
    
    // Kiểm tra thông tin khách hàng (phải có SĐT hoặc Địa chỉ mới cho gửi)
    const profile = await prisma.user_profiles.findUnique({ where: { user_id } });
    if (!profile || (!profile.phone_number && !profile.address)) {
      throw new Error("PROFILE_INCOMPLETE");
    }

    if (!components || !Array.isArray(components) || components.length === 0) {
      throw new Error("Không có cấu hình để gửi!");
    }

    // Tính giá tiền tự động làm mốc tham khảo ban đầu
    const priceData = await this.calculateRealtime({ product_id, components });

    // Tạo mảng specs dựa theo từng component
    const specsData = components.map((comp, idx) => {
      const area = (parseFloat(comp.width) / 1000) * (parseFloat(comp.height) / 1000);
      const detail = priceData.component_details[idx];
      return {
        component_name: comp.component_name,
        material_id: comp.material_id || null,
        thickness_id: comp.thickness_id || null,
        paint_id: comp.paint_id || null,
        dimensions: {
          product_id,
          width: parseFloat(comp.width),
          height: parseFloat(comp.height),
          area: area,
        },
        snapshot_price: (detail ? detail.material_cost + detail.paint_cost : 0), 
        note,
      };
    });

    return await prisma.quotations.create({
      data: {
        user_id,
        title: title || "Yêu cầu báo giá tùy chỉnh",
        total_quoted_price: priceData.total_amount,
        status: "pending_admin",
        quotation_specs: { create: specsData },
      },
      include: { quotation_specs: true },
    });
  }

  // 3.2 LẤY DANH SÁCH CÁ NHÂN (Cho User Dashboard)
  async getUserQuotations(user_id, statuses = []) {
    const whereClause = { user_id };
    if (statuses && statuses.length > 0) {
      whereClause.status = { in: statuses };
    }
    
    return await prisma.quotations.findMany({
      where: whereClause,
      include: {
        quotation_specs: {
          include: {
            materials: true,
            material_thickness: true,
            paint_types: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });
  }

  // 3.3 ADMIN DUYỆT BÁO GIÁ & GỬI EMAIL
  async approveQuoteRequest(id, data) {
    const { total_quoted_price } = data;
    
    const quotation = await this.getQuotationById(id);
    if (!quotation) throw new Error("Báo giá không tồn tại!");
    
    // Cập nhật giá bán cuối cùng do Admin chốt và đổi status
    const updatedQuote = await prisma.quotations.update({
      where: { id },
      data: { 
        total_quoted_price: total_quoted_price !== undefined ? total_quoted_price : quotation.total_quoted_price,
        status: "sent_to_customer" 
      },
      include: {
        users: true
      }
    });

    // Tự động gửi Email cho khách hàng nếu họ có email
    if (updatedQuote.users && updatedQuote.users.email) {
      try {
        await sendQuotationEmail(updatedQuote.users.email, updatedQuote);
      } catch (err) {
        console.error("Lỗi gửi email báo giá:", err);
        // Không block flow nếu lỗi email
      }
    }

    return updatedQuote;
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
    const { user_id, session_id, items } = data; // items là một mảng các sản phẩm, mỗi sản phẩm chứa mảng components

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
      const { product_id, components, note } = item;

      if (!components || !Array.isArray(components) || components.length === 0) continue;

      for (const comp of components) {
        const {
          component_name,
          width,
          height,
          material_id,
          thickness_id,
          paint_id,
        } = comp;

        const area = (parseFloat(width) / 1000) * (parseFloat(height) / 1000);

        // Truy vấn DB lấy giá gốc của 3 nguyên liệu
        const [material, thickness, paint] = await Promise.all([
          prisma.materials.findUnique({ where: { id: material_id } }),
          prisma.material_thickness.findUnique({ where: { id: thickness_id } }),
          prisma.paint_types.findUnique({ where: { id: paint_id } }),
        ]);

        if (!material || !thickness || !paint) {
          throw new Error(
            `Vật tư, Độ dày hoặc Sơn của linh kiện '${component_name || "Chưa rõ"}' không tồn tại!`,
          );
        }

        // Công thức lõi (Phân bổ nhân công theo diện tích linh kiện để gộp lại đúng tổng diện tích sản phẩm)
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
          component_name,
          material_id: material_id || null,
          thickness_id: thickness_id || null,
          paint_id: paint_id || null,
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
    const {
      product_id,
      labor_category_id,
      labor_model_id,
      components,
    } = data;

    if (!components || !Array.isArray(components) || components.length === 0) {
      throw new Error("Sản phẩm chưa cấu hình linh kiện!");
    }

    // 1. Lấy dữ liệu sản phẩm gốc và nhân công (Chung cho toàn sản phẩm)
    const [product, laborRate] = await Promise.all([
      prisma.products.findUnique({ where: { id: product_id } }),
      prisma.labor_rates.findFirst({
        where: { category_id: labor_category_id, model_id: labor_model_id },
      }),
    ]);

    const base_product_price = product?.price_adjustment ? parseFloat(product.price_adjustment) : 0;
    
    let total_area = 0;
    let total_material_price = 0;
    let total_paint_price = 0;
    const componentDetails = [];

    // 2. Lặp tính giá cho từng linh kiện
    for (const comp of components) {
      const { component_name, width, height, material_id, thickness_id, paint_id } = comp;
      const area = (parseFloat(width || 0) / 1000) * (parseFloat(height || 0) / 1000);
      total_area += area;

      const [material, thickness, paint] = await Promise.all([
        material_id ? prisma.materials.findUnique({ where: { id: material_id } }) : null,
        thickness_id ? prisma.material_thickness.findUnique({ where: { id: thickness_id } }) : null,
        paint_id ? prisma.paint_types.findUnique({ where: { id: paint_id } }) : null,
      ]);

      if (!material) {
        throw new Error(`Dữ liệu vật tư không hợp lệ cho linh kiện: ${component_name}`);
      }

      const mat_multiplier = thickness ? parseFloat(thickness.price_multiplier || 1) : 1.0;
      const mat_base_price = parseFloat(material.base_price || 0);
      const material_price = mat_base_price * mat_multiplier * area;
      const paint_price = paint ? parseFloat(paint.price_per_sqm || 0) * area : 0;

      total_material_price += material_price;
      total_paint_price += paint_price;

      componentDetails.push({
        name: component_name,
        area: area.toFixed(2),
        material_cost: material_price,
        paint_cost: paint_price
      });
    }

    // 3. Tính tiền nhân công tổng
    const labor_price = laborRate ? parseFloat(laborRate.rate_amount || 0) * total_area : 0;

    const total_price = base_product_price + total_material_price + labor_price + total_paint_price;

    return {
      total_area: total_area.toFixed(2),
      component_details: componentDetails,
      breakdown_costs: [
        { name: "Sản phẩm gốc", amount: base_product_price },
        { name: "Vật tư (Theo linh kiện)", amount: total_material_price },
        { name: "Nhân công gia công", amount: labor_price },
        { name: "Công sơn tĩnh điện", amount: total_paint_price },
      ],
      total_amount: total_price,
    };
  }
  // LƯU CẤU HÌNH YÊU THÍCH CỦA KHÁCH HÀNG (Lưu vào DB với status 'favorite')
  async saveFavorite(data) {
    const { user_id, title, product_id, components, note } = data;

    if (!user_id) throw new Error("Vui lòng đăng nhập để lưu cấu hình!");
    if (!components || !Array.isArray(components) || components.length === 0) {
      throw new Error("Không có linh kiện nào để lưu!");
    }

    // Tính giá tiền tại thời điểm lưu
    const priceData = await this.calculateRealtime({ product_id, components });

    // Tạo mảng specs dựa theo từng component
    const specsData = components.map((comp, idx) => {
      const area = (parseFloat(comp.width) / 1000) * (parseFloat(comp.height) / 1000);
      const detail = priceData.component_details[idx];
      return {
        component_name: comp.component_name,
        material_id: comp.material_id || null,
        thickness_id: comp.thickness_id || null,
        paint_id: comp.paint_id || null,
        dimensions: {
          product_id,
          width: parseFloat(comp.width),
          height: parseFloat(comp.height),
          area: area,
        },
        snapshot_price: (detail ? detail.material_cost + detail.paint_cost : 0), 
        note,
      };
    });

    // Tạo báo giá với trạng thái favorite
    return await prisma.quotations.create({
      data: {
        user_id,
        title: title || "Cấu hình yêu thích chưa đặt tên",
        total_quoted_price: priceData.total_amount,
        status: "favorite",
        quotation_specs: { create: specsData },
      },
      include: { quotation_specs: true },
    });
  }
}
module.exports = new QuotationService();
