const prisma = require("../models/prisma");
const {
  sendQuotationEmail,
  sendOrderConfirmationEmail,
} = require("../utils/mailer.utils");

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
        product_drawings: {
          include: {
            drawing_parts: true
          }
        },
      },
    });
    if (!quotation) throw new Error("Không tìm thấy báo giá này!");

    // Nếu báo giá chưa có bản vẽ tổng thể, tự động lấy bản vẽ mặc định của Sản phẩm (dựa vào product_id trong specs)
    if (!quotation.product_drawings && quotation.quotation_specs && quotation.quotation_specs.length > 0) {
      const firstSpec = quotation.quotation_specs[0];
      const productId = firstSpec.dimensions?.product_id;
      if (productId) {
        const activeDrawing = await prisma.product_drawings.findFirst({
          where: { product_id: productId, is_active: true },
          include: { drawing_parts: true }
        });
        if (activeDrawing) {
          quotation.product_drawings = activeDrawing;
          // Tự động cập nhật luôn vào DB để lần sau khỏi query
          await prisma.quotations.update({
            where: { id: quotation.id },
            data: { drawing_id: activeDrawing.id }
          });
        }
      }
    }

    if (quotation.quotation_specs && quotation.quotation_specs.length > 0) {
      const componentNames = quotation.quotation_specs
        .map((spec) => spec.component_name)
        .filter(Boolean);

      if (componentNames.length > 0) {
        const templates = await prisma.component_templates.findMany({
          where: { component_name: { in: componentNames } },
        });

        const templateMap = {};
        templates.forEach((t) => {
          templateMap[t.component_name] = t.blueprint_html_code;
        });

        quotation.quotation_specs.forEach((spec) => {
          if (templateMap[spec.component_name]) {
            spec.blueprint_html_code = templateMap[spec.component_name];
          }
        });
      }
    }

    return quotation;
  }

  // 3. CẬP NHẬT TRẠNG THÁI (VD: Từ "draft" sang "approved" hoặc "cancelled")
  async updateStatus(id, status) {
    const validStatuses = [
      "draft",
      "pending_admin",
      "sent_to_customer",
      "approved",
      "customer_approved",
      "admin_confirmed",
      "rejected",
      "cancelled",
      "under_review",
      "favorite",
    ];
    if (!validStatuses.includes(status)) {
      throw new Error("Trạng thái không hợp lệ!");
    }

    const quotation = await this.getQuotationById(id);

    const updatedQuotation = await prisma.quotations.update({
      where: { id },
      data: { status },
      include: { users: true },
    });

    if (global.io) {
      if (updatedQuotation.user_id) {
        global.io
          .to(`room_user_${updatedQuotation.user_id}`)
          .emit("quote_status_changed", {
            message: `Báo giá của bạn đã chuyển sang trạng thái: ${status}`,
            data: updatedQuotation,
          });
      }
      global.io.to("room_admin").emit("quote_status_changed", {
        message: `Báo giá #${id.slice(0, 8)} đã chuyển sang trạng thái: ${status}`,
        data: updatedQuotation,
      });
    }

    // Nếu Admin xác nhận lên đơn hàng -> Sinh ra Order và gửi email cho Khách hàng
    if (status === "admin_confirmed") {
      try {
        // 1. Dùng Date.now() để mã đơn hàng hoàn toàn unique
        const orderCode = `KPM-ORD-${Date.now()}`;

        // 2. Lấy giá trị tiền và ép kiểu an toàn về Number (tránh lỗi NaN làm sập Prisma)
        const rawAmount =
          updatedQuotation.user_proposed_price ||
          updatedQuotation.admin_proposed_price ||
          updatedQuotation.total_quoted_price;
        const totalAmount = Number(rawAmount) || 0;

        // 3. Chuẩn bị Object Data với cú pháp 'connect' của Prisma cho khóa ngoại
        const orderData = {
          order_code: orderCode,
          production_status: "pending_payment",
          total_amount: totalAmount,
          quotations: { connect: { id: id } }, // Connect tới báo giá
        };

        // Chỉ connect user nếu báo giá đó có user_id (tránh lỗi truyền null vào connect)
        if (updatedQuotation.user_id) {
          orderData.users = { connect: { id: updatedQuotation.user_id } };
        }

        // 4. Tạo Order
        const newOrder = await prisma.orders.create({
          data: orderData,
        });

        // 5. Gửi email xác nhận
        if (updatedQuotation.users && updatedQuotation.users.email) {
          await sendOrderConfirmationEmail(
            updatedQuotation.users.email,
            newOrder,
            updatedQuotation,
          );
        }
      } catch (err) {
        console.error("Lỗi khi tạo Đơn hàng hoặc gửi email:", err);
      }
    }

    return updatedQuotation;
  }

  // 3.1 GỬI YÊU CẦU BÁO GIÁ (Khách hàng tạo request mới)
  async requestCustomQuote(data) {
    const { user_id, title, nick_name, product_id, components, note } = data;

    if (!user_id) throw new Error("Vui lòng đăng nhập để gửi yêu cầu báo giá!");

    // Kiểm tra thông tin khách hàng (phải có SĐT hoặc Địa chỉ mới cho gửi)
    const profile = await prisma.user_profiles.findUnique({
      where: { user_id },
    });
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
      const l = parseFloat(comp.length || 0) / 1000;
      const w = parseFloat(comp.width || 0) / 1000;
      const h = parseFloat(comp.height || 0) / 1000;
      
      let area = 0;
      if (l > 0 && w > 0 && h > 0) area = l * w * h;
      else if (l > 0 && w > 0) area = l * w;
      else if (l > 0 && h > 0) area = l * h;
      else if (w > 0 && h > 0) area = w * h;
      else area = l || w || h || 0;
      const detail = priceData.component_details[idx];
      return {
        component_name: comp.component_name,
        material_id: comp.material_id || null,
        thickness_id: comp.thickness_id || null,
        paint_id: comp.paint_id || null,
        dimensions: {
          product_id,
          length: l,
          width: w,
          height: parseFloat(comp.height || 0),
          area: area,
          waste_configs: comp.waste_configs || null,
          waste_rate: comp.waste_rate || null,
        },
        snapshot_price: detail ? detail.material_cost + detail.paint_cost : 0,
        note,
      };
    });

    const newQuote = await prisma.quotations.create({
      data: {
        user_id,
        title: title || "Yêu cầu báo giá tùy chỉnh",
        nick_name: nick_name || null,
        total_quoted_price: priceData.total_amount,
        status: "pending_admin",
        quotation_specs: { create: specsData },
      },
      include: { quotation_specs: true },
    });

    if (global.io) {
      global.io.to("room_admin").emit("new_quotation", {
        message: "Có yêu cầu báo giá mới từ khách hàng!",
        data: newQuote,
      });
    }

    return newQuote;
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
        quotation_attachments: true,
      },
      orderBy: { created_at: "desc" },
    });
  }

  // 3.3 ADMIN DUYỆT BÁO GIÁ & GỬI EMAIL
  async approveQuoteRequest(id, data) {
    const { admin_proposed_price } = data;

    // 1. Lấy báo giá hiện tại từ DB
    const quotation = await this.getQuotationById(id);
    if (!quotation) throw new Error("Không tìm thấy báo giá này!");
    if (
      !quotation.quotation_attachments ||
      quotation.quotation_attachments.length === 0
    ) {
      throw new Error(
        "Vui lòng tải lên ít nhất 1 ảnh Bản vẽ 3D trước khi duyệt gửi báo giá cho khách!",
      );
    }
    // 2. CHECK GIÁ TRƯỚC KHI UPDATE VÀO DB
    if (!quotation.quotation_specs || quotation.quotation_specs.length === 0) {
      console.warn(
        `Báo giá ${id} không có cấu hình linh kiện (quotation_specs rỗng).`,
      );
    } else {
      const firstSpecDims = quotation.quotation_specs[0]?.dimensions || {};

      const calculated = await this.calculateRealtime({
        product_id: firstSpecDims.product_id,
        labor_category_id: firstSpecDims.labor_category_id,
        labor_model_id: firstSpecDims.labor_model_id,
        components: quotation.quotation_specs.map((spec) => ({
          component_name: spec.component_name,
          length: spec.dimensions?.length,
          width: spec.dimensions?.width,
          height: spec.dimensions?.height,
          material_id: spec.material_id,
          thickness_id: spec.thickness_id,
          paint_id: spec.paint_id,
          waste_configs: spec.dimensions?.waste_configs,
          waste_rate: spec.dimensions?.waste_rate,
        })),
      });

      // Lấy giá admin vừa nhập vào (nếu admin không nhập gì thì lấy total_quoted_price)
      const adminPrice =
        admin_proposed_price !== undefined
          ? admin_proposed_price
          : quotation.total_quoted_price;

      // 3. So sánh giá admin nhập vào với giá vốn hệ thống tự tính (tối thiểu 90% giá vốn)
      if (adminPrice < calculated.total_amount * 0.9) {
        throw new Error(
          `Giá admin đề xuất (${adminPrice}) thấp hơn 90% giá vốn hệ thống tính toán (${calculated.total_amount * 0.9}). Vui lòng kiểm tra lại!`,
        );
      }
    }

    // 4. QUA ĐƯỢC BƯỚC CHECK Ở TRÊN THÌ MỚI UPDATE DB
    const updateQuote = await prisma.quotations.update({
      where: { id },
      data: {
        admin_proposed_price:
          admin_proposed_price !== undefined
            ? admin_proposed_price
            : quotation.total_quoted_price,
        status: "admin_quoted",
      },
      include: {
        users: { include: { user_profiles: true } },
        quotation_specs: { include: { materials: true, paint_types: true } },
      },
    });

    // 5. GỬI EMAIL VÀ SOCKET
    if (updateQuote.users && updateQuote.users.email) {
      try {
        await sendQuotationEmail(updateQuote.users.email, updateQuote);
      } catch (err) {
        console.error("Lỗi khi gửi email báo giá:", err);
      }
    }

    if (global.io) {
      if (updateQuote.user_id) {
        global.io.to(`room_user_${updateQuote.user_id}`).emit("quote_updated", {
          message: "Admin đã cập nhật giá cho yêu cầu báo giá của bạn!",
          data: updateQuote,
        });
      }
      global.io.to("room_admin").emit("quote_updated", {
        message: "Một báo giá vừa được duyệt giá thành công!",
        data: updateQuote,
      });
    }

    return updateQuote;
  }

  // 3.4 User mặc cả lại giá
  async userNegotiate(id, user_id, user_proposed_price) {
    const quotation = await this.getQuotationById(id);

    // 1. Kiểm tra quyền và trạng thái trước
    if (quotation.user_id !== user_id) {
      throw new Error("Bạn không có quyền mặc cả báo giá này!");
    }
    if (quotation.status !== "admin_quoted") {
      throw new Error("Chỉ có thể mặc cả báo giá khi đã được admin duyệt!");
    }

    // 2. Lấy giá gốc và giá user gửi lên
    const originalPrice = parseFloat(
      quotation.admin_proposed_price || quotation.total_quoted_price,
    );
    const userPrice = parseFloat(user_proposed_price);

    // 3. Validate logic giá
    if (userPrice >= originalPrice) {
      throw new Error("Giá mặc cả phải thấp hơn mức giá xưởng đề xuất!");
    }

    const minAllowedPrice = originalPrice * 0.9;
    if (userPrice < minAllowedPrice) {
      throw new Error(
        "Giá mặc cả không được thấp hơn 10% so với giá xưởng đề xuất!",
      );
    }

    // 4. Cập nhật vào Database
    const updateQuote = await prisma.quotations.update({
      where: { id },
      data: {
        user_proposed_price: userPrice, // Lưu luôn giá trị số đã parse cho an toàn
        status: "user_proposed",
      },
    });

    if (global.io) {
      global.io.to("room_admin").emit("quote_negotiated", {
        message: "Khách hàng vừa đề xuất một mức giá mặc cả mới!",
        data: updateQuote,
      });
    }

    return updateQuote;
  }

  // 3.5 Admin chốt trạng thái cuối cùng
  async adminFinalDecision(id, final_status) {
    const allowedStatuses = [
      "processing",
      "under_review",
      "admin_confirmed",
      "cancelled",
    ];
    if (!allowedStatuses.includes(final_status)) {
      throw new Error("Trạng thái cuối cùng không hợp lệ!");
    }
    const quotation = await this.getQuotationById(id);
    if (
      quotation.status !== "user_proposed" &&
      quotation.status !== "admin_quoted"
    ) {
      throw new Error("Chỉ có thể chốt khi đang ở trạng thái mặc cả!");
    }
    return await this.updateStatus(id, final_status);
  }

  // 4. THÊM FILE ĐÍNH KÈM (Lưu Link bản vẽ từ FE gửi xuống)
  async addAttachment(quotation_id, data) {
    const { file_name, file_url } = data;
    if (!file_name || !file_url)
      throw new Error("Tên file và URL không được trống!");
    const quotation = await this.getQuotationById(quotation_id);
    if (!quotation) throw new Error("Báo giá không tồn tại!");
    // chỉ cho phép gửi file ảnh qua nếu đang ở trạng thái "draft" hoặc "pending_admin" (chưa gửi cho khách)
    if (quotation.status !== "draft" && quotation.status !== "pending_admin") {
      throw new Error("Không thể thêm file đính kèm!");
    }
    const attachment = await prisma.quotation_attachments.create({
      data: {
        quotation_id,
        file_name,
        file_url,
      },
    });

    if (global.io) {
      if (quotation.user_id) {
        global.io.to(`room_user_${quotation.user_id}`).emit("quote_updated", {
          message: "Admin vừa đính kèm bản vẽ mới cho báo giá của bạn!",
        });
      }
      global.io.to("room_admin").emit("quote_updated", {
        message: "Đã thêm bản vẽ đính kèm thành công!",
      });
    }

    return attachment;
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
    const { user_id, session_id, items } = data;
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("Không có sản phẩm nào để tính giá!");
    }
    let total_quoted_price = 0;
    const quotation_specs_data = [];

    const profit = 1.3;
    // 1. Thu thập toàn bộ ID
    const materialIds = new Set();
    const thicknessIds = new Set();
    const paintIds = new Set();

    // 2. Lấy đơn giá nhân công mặc định
    const laborRate = await prisma.labor_rates.findFirst();
    const labor_price_per_sqm = laborRate
      ? parseFloat(laborRate.rate_amount)
      : 0;

    // 3. Query toàn bộ dữ liệu 1 lần duy nhất
    items.forEach((item) => {
      (item.components || []).forEach((comp) => {
        if (comp.material_id) materialIds.add(comp.material_id);
        if (comp.thickness_id) thicknessIds.add(comp.thickness_id);
        if (comp.paint_id) paintIds.add(comp.paint_id);
      });
    });

    // 4. Lấy dữ liệu từ DB
    const [materialsDb, thicknessDb, paintsDb] = await Promise.all([
      prisma.materials.findMany({
        where: { id: { in: Array.from(materialIds) } },
      }),
      prisma.material_thickness.findMany({
        where: { id: { in: Array.from(thicknessIds) } },
      }),
      prisma.paint_types.findMany({
        where: { id: { in: Array.from(paintIds) } },
      }),
    ]);

    // 5. Chuyển array thành Map object để tra cứu
    const mapMaterials = Object.fromEntries(materialsDb.map((m) => [m.id, m]));
    const mapThickness = Object.fromEntries(thicknessDb.map((t) => [t.id, t]));
    const mapPaints = Object.fromEntries(paintsDb.map((p) => [p.id, p]));

    // 6. Vòng lặp tính toán
    for (const item of items) {
      const { product_id, components, note } = item;
      const itemQty = item.quantity || 1; // Số lượng sản phẩm

      if (!components || !Array.isArray(components) || components.length === 0)
        continue;

      for (const comp of components) {
        const {
          component_name,
          length,
          width,
          height,
          material_id,
          thickness_id,
          paint_id,
        } = comp;
        const compQty = comp.quantity || 1; // Số lượng linh kiện (nếu có)

        const material = mapMaterials[material_id];
        const thickness = mapThickness[thickness_id];
        const paint = mapPaints[paint_id];

        if (!material) {
          throw new Error(
            `Dữ liệu vật tư không hợp lệ cho linh kiện: ${component_name}`,
          );
        }

        // Tính diện tích 1 linh kiện (m2) (Dùng length * width vì height thường = 0)
        const l = parseFloat(length || height || 0);
        const w = parseFloat(width || 0);
        const area = (l / 1000) * (w / 1000);

        // Công thức tính không dùng % hao hụt (wasted) nữa, mà dùng số lượng tuyệt đối từ waste_configs hoặc waste_rate
        const mat_multiplier = thickness
          ? parseFloat(thickness.price_multiplier || 1)
          : 1.0;

        let consumedQty = area * 1.05;
        if (comp.waste_configs && comp.waste_configs[material_id]) {
          consumedQty = parseFloat(comp.waste_configs[material_id].rate || 0);
        } else if (comp.waste_rate) {
          consumedQty = parseFloat(comp.waste_rate);
        }

        const material_cost =
          parseFloat(material.base_price) * mat_multiplier * consumedQty;

        const paint_cost = paint ? parseFloat(paint.price_per_sqm) * area : 0;
        const labor_cost = labor_price_per_sqm * area;

        // Tổng chi phí vốn cho 1 linh kiện
        const base_cost = material_cost + paint_cost + labor_cost;

        // Giá bán ra có lợi nhuận
        const final_price_per_unit = base_cost * profit;

        // Nhân với số lượng linh kiện và sản phẩm
        const total_comp_price = final_price_per_unit * compQty * itemQty;

        total_quoted_price += total_comp_price;

        quotation_specs_data.push({
          component_name,
          material_id,
          thickness_id,
          paint_id,
          dimensions: {
            product_id,
            width: parseFloat(width),
            height: parseFloat(height),
            area,
            quantity: compQty * itemQty, // Lưu lại tổng số lượng thực tế
            breakdown_costs: {
              material: material_cost,
              paint: paint_cost,
              labor: labor_cost,
              unit_price: final_price_per_unit,
              total_price: total_comp_price,
            },
          },
          snapshot_price: total_comp_price, // Lưu giá thực tế thu của khách
          note,
        });
      }
    }

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
        quotation_specs: true,
      },
    });
  }
  // CỖ MÁY TÍNH GIÁ REAL-TIME CHO FRONTEND (Không lưu DB)
  async calculateRealtime(data) {
    const { product_id, labor_category_id, labor_model_id, components } = data;

    if (!components || !Array.isArray(components) || components.length === 0) {
      throw new Error("Sản phẩm chưa cấu hình linh kiện!");
    }

    // 1. Lấy dữ liệu sản phẩm gốc và nhân công (Chung cho toàn sản phẩm)
    const [product, laborRate] = await Promise.all([
      product_id
        ? prisma.products.findUnique({ where: { id: product_id } })
        : null,
      prisma.labor_rates.findFirst({
        where: { category_id: labor_category_id, model_id: labor_model_id },
      }),
    ]);

    const base_product_price = product?.price_adjustment
      ? parseFloat(product.price_adjustment)
      : 0;

    let total_area = 0;
    let total_material_price = 0;
    let total_paint_price = 0;
    const componentDetails = [];

    const profit = 1.3;

    // 2. Lặp tính giá cho từng linh kiện
    for (const comp of components) {
      const {
        component_name,
        length,
        width,
        height,
        material_id,
        thickness_id,
        paint_id,
      } = comp;

      const l = parseFloat(length || 0) / 1000;
      const w = parseFloat(width || 0) / 1000;
      const h = parseFloat(height || 0) / 1000;
      
      let area = 0;
      if (l > 0 && w > 0 && h > 0) area = l * w * h;
      else if (l > 0 && w > 0) area = l * w;
      else if (l > 0 && h > 0) area = l * h;
      else if (w > 0 && h > 0) area = w * h;
      else area = l || w || h || 0;

      total_area += area;

      const [material, thickness, paint] = await Promise.all([
        material_id
          ? prisma.materials.findUnique({ where: { id: material_id } })
          : null,
        thickness_id
          ? prisma.material_thickness.findUnique({
              where: { id: thickness_id },
            })
          : null,
        paint_id
          ? prisma.paint_types.findUnique({ where: { id: paint_id } })
          : null,
      ]);

      if (!material) {
        throw new Error(
          `Dữ liệu vật tư không hợp lệ cho linh kiện: ${component_name}`,
        );
      }

      const mat_multiplier = thickness
        ? parseFloat(thickness.price_multiplier || 1)
        : 1.0;
      const mat_base_price = parseFloat(material.base_price || 0);

      // Áp dụng định mức tiêu hao tuyệt đối
      let consumedQty = area * 1.05;
      if (comp.waste_configs && comp.waste_configs[material_id]) {
        consumedQty = parseFloat(comp.waste_configs[material_id].rate || 0);
      } else if (comp.waste_rate) {
        consumedQty = parseFloat(comp.waste_rate);
      }

      const material_price =
        mat_base_price * mat_multiplier * consumedQty * profit;
      const paint_price = paint
        ? parseFloat(paint.price_per_sqm || 0) * area * profit
        : 0;

      total_material_price += material_price;
      total_paint_price += paint_price;

      componentDetails.push({
        name: component_name,
        area: area.toFixed(2),
        material_cost: material_price,
        paint_cost: paint_price,
      });
    }

    // 3. Tính tiền nhân công tổng (Đã áp dụng profit)
    const labor_price = laborRate
      ? parseFloat(laborRate.rate_amount || 0) * total_area * profit
      : 0;

    const total_price =
      base_product_price +
      total_material_price +
      labor_price +
      total_paint_price;

    return {
      total_area: total_area.toFixed(2),
      component_details: componentDetails,
      breakdown_costs: [
        { name: "Phụ phí / Lắp ráp (Cố định)", amount: base_product_price },
        {
          name: "Vật tư (gồm Hao hụt & Lợi nhuận)",
          amount: total_material_price,
        },
        { name: "Nhân công (Đã có Lợi nhuận)", amount: labor_price },
        {
          name: "Công sơn tĩnh điện (Đã có Lợi nhuận)",
          amount: total_paint_price,
        },
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
      const l = parseFloat(comp.length || comp.height || 0);
      const w = parseFloat(comp.width || 0);
      const area = (l / 1000) * (w / 1000);
      const detail = priceData.component_details[idx];
      return {
        component_name: comp.component_name,
        material_id: comp.material_id || null,
        thickness_id: comp.thickness_id || null,
        paint_id: comp.paint_id || null,
        dimensions: {
          product_id,
          length: l,
          width: w,
          height: parseFloat(comp.height || 0),
          area: area,
          waste_configs: comp.waste_configs || null,
          waste_rate: comp.waste_rate || null,
        },
        snapshot_price: detail ? detail.material_cost + detail.paint_cost : 0,
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
