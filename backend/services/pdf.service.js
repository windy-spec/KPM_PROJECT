const pdfmake = require("pdfmake");
const path = require("path");
const fs = require("fs");

const fontPath = path.join(__dirname, "../fonts");
const fonts = {
  Roboto: {
    normal: path.join(fontPath, "Roboto-Regular.ttf"),
    bold: path.join(fontPath, "Roboto-Medium.ttf"),
    italics: path.join(fontPath, "Roboto-Italic.ttf"),
    bolditalics: path.join(fontPath, "Roboto-MediumItalic.ttf"),
  },
};
// Set fonts for pdfmake (Required in version 0.3.x)
pdfmake.setFonts(fonts);

// Cấu hình policy bảo mật cho pdfmake để cho phép đọc file fonts và template từ ổ cứng
pdfmake.setUrlAccessPolicy(() => true);
pdfmake.setLocalAccessPolicy(() => true);

class PdfService {
  // Method cũ giữ lại cho tương thích
  async generateWarehousePDF(materials) {
    return this._createPdfDocument(materials, "PHIẾU XUẤT KHO VẬT TƯ");
  }

  // --- Helper để lấy logo base64 ---
  _getLogoBase64() {
    try {
      const logoPath = path.join(__dirname, "../templates/logo.png");
      const base64 = fs.readFileSync(logoPath).toString("base64");
      return `data:image/png;base64,${base64}`;
    } catch (error) {
      console.warn("Không tìm thấy file logo.png, bỏ qua logo.");
      return null;
    }
  }

  // --- BÁO CÁO 1: TỒN KHO VẬT TƯ ---
  async generateInventoryReportPDF(materials) {
    const title = "BÁO CÁO TỒN KHO VẬT TƯ";
    const logoData = this._getLogoBase64();

    // Format date: dd/MM/yyyy (HH:mm)
    const now = new Date();
    const dateStr = now.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const timeStr = now.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const formattedDateTime = `${dateStr} (${timeStr})`;

    const items = Array.isArray(materials)
      ? materials
      : materials
        ? [materials]
        : [];

    const tableHeader = [
      {
        text: "STT\n(1)",
        bold: true,
        alignment: "center",
        fillColor: "#e2e8f0",
      },
      {
        text: "Mã VT\n(2)",
        bold: true,
        alignment: "center",
        fillColor: "#e2e8f0",
      },
      {
        text: "Tên vật tư\n(3)",
        bold: true,
        alignment: "center",
        fillColor: "#e2e8f0",
      },
      {
        text: "ĐVT\n(4)",
        bold: true,
        alignment: "center",
        fillColor: "#e2e8f0",
      },
      {
        text: "Còn nguyên\n(5)",
        bold: true,
        alignment: "center",
        fillColor: "#e2e8f0",
      },
      {
        text: "Vụn\n(6)",
        bold: true,
        alignment: "center",
        fillColor: "#e2e8f0",
      },
      {
        text: "Tổng tồn\n(7)",
        bold: true,
        alignment: "center",
        fillColor: "#e2e8f0",
      },
      {
        text: "Mức\ntối thiểu\n(8)",
        bold: true,
        alignment: "center",
        fillColor: "#e2e8f0",
      },
      {
        text: "Cần nhập\n(9)",
        bold: true,
        alignment: "center",
        fillColor: "#e2e8f0",
      },
      {
        text: "Ghi chú\n(10)",
        bold: true,
        alignment: "center",
        fillColor: "#e2e8f0",
      },
    ];

    const tableBody = [tableHeader];

    items.forEach((item, index) => {
      const q = parseFloat(item.quantity) || 0;
      const l = parseFloat(item.leftover_amount) || 0;
      const min = parseFloat(item.min_stock_level) || 0;
      const total = q + l;
      const needed = Math.max(0, min - total);

      tableBody.push([
        { text: index + 1, alignment: "center" },
        {
          text: item.material_code || item.materialCode || "",
          alignment: "center",
        },
        item.material_name || item.materialName || "",
        { text: item.unit_name || item.unit || "", alignment: "center" },
        { text: q.toLocaleString("vi-VN"), alignment: "right" },
        { text: l.toLocaleString("vi-VN"), alignment: "right" },
        { text: total.toLocaleString("vi-VN"), alignment: "right", bold: true },
        { text: min.toLocaleString("vi-VN"), alignment: "right" },
        {
          text: needed > 0 ? needed.toLocaleString("vi-VN") : "-",
          alignment: "right",
          color: needed > 0 ? "red" : "black",
          bold: needed > 0,
        },
        { text: item.note || "", alignment: "left" },
      ]);
    });

    const docDefinition = this._buildProfessionalDocDef(
      title,
      formattedDateTime,
      items.length,
      tableBody,
      [
        "auto",
        "auto",
        "*",
        "auto",
        "auto",
        "auto",
        "auto",
        "auto",
        "auto",
        "auto",
      ],
      logoData,
    );
    const pdfDoc = pdfmake.createPdf(docDefinition);
    return await pdfDoc.getBuffer();
  }

  // --- BÁO CÁO 2: VẬT TƯ THỪA ---
  async generateLeftoverReportPDF(materials) {
    const title = "BÁO CÁO VẬT TƯ THỪA";
    const logoData = this._getLogoBase64();

    // Format date: dd/MM/yyyy (HH:mm)
    const now = new Date();
    const dateStr = now.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const timeStr = now.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const formattedDateTime = `${dateStr} (${timeStr})`;

    // Chỉ lấy những vật tư có tồn vụn > 0
    const rawItems = Array.isArray(materials)
      ? materials
      : materials
        ? [materials]
        : [];
    const items = rawItems.filter(
      (i) => (parseFloat(i.leftover_amount) || 0) > 0,
    );

    const tableHeader = [
      {
        text: "STT\n(1)",
        bold: true,
        alignment: "center",
        fillColor: "#e2e8f0",
      },
      {
        text: "Mã VT\n(2)",
        bold: true,
        alignment: "center",
        fillColor: "#e2e8f0",
      },
      {
        text: "Tên vật tư\n(3)",
        bold: true,
        alignment: "center",
        fillColor: "#e2e8f0",
      },
      {
        text: "ĐVT\n(4)",
        bold: true,
        alignment: "center",
        fillColor: "#e2e8f0",
      },
      {
        text: "Vụn\n(5)",
        bold: true,
        alignment: "center",
        fillColor: "#e2e8f0",
      },
      {
        text: "Ghi chú\n(6)",
        bold: true,
        alignment: "center",
        fillColor: "#e2e8f0",
      },
    ];

    const tableBody = [tableHeader];

    items.forEach((item, index) => {
      const l = parseFloat(item.leftover_amount) || 0;
      tableBody.push([
        { text: index + 1, alignment: "center" },
        {
          text: item.material_code || item.materialCode || "",
          alignment: "center",
        },
        item.material_name || item.materialName || "",
        { text: item.unit_name || item.unit || "", alignment: "center" },
        { text: l.toLocaleString("vi-VN"), alignment: "right", bold: true },
        { text: item.note || "", alignment: "left" },
      ]);
    });

    const docDefinition = this._buildProfessionalDocDef(
      title,
      formattedDateTime,
      items.length,
      tableBody,
      ["auto", "auto", "*", "auto", "auto", "25%"],
      logoData,
    );
    const pdfDoc = pdfmake.createPdf(docDefinition);
    return await pdfDoc.getBuffer();
  }

  // Khung sườn chung cho báo cáo chuyên nghiệp
  _buildProfessionalDocDef(
    title,
    dateTime,
    totalItems,
    tableBody,
    widths,
    logoData,
  ) {
    const headerLeft = {
      stack: [
        ...(logoData
          ? [
              {
                image: logoData,
                width: 80,
                alignment: "center",
                margin: [0, 0, 0, 5],
              },
            ]
          : []),
        { text: "CÔNG TY KPM", fontSize: 13, bold: true, alignment: "center" },
        {
          text: "Hệ thống Kho - Quản lý Vật tư & Sản xuất",
          fontSize: 11,
          italics: true,
          alignment: "center",
        },
      ],
      width: 200,
    };

    const headerRight = {
      stack: [
        { text: "Mẫu số: 01-VT", bold: true, alignment: "right" },
        {
          text: "(Ban hành theo quy định nội bộ\ncủa Công ty)",
          italics: true,
          alignment: "right",
          fontSize: 10,
        },
      ],
      width: "*",
    };

    return {
      pageOrientation: "landscape",
      pageSize: "A4",
      pageMargins: [30, 30, 30, 40],
      footer: function (currentPage, pageCount) {
        return {
          text: `Trang ${currentPage} / ${pageCount}`,
          alignment: "right",
          margin: [0, 10, 30, 0],
          fontSize: 10,
          italics: true,
        };
      },
      content: [
        // HEADER
        {
          columns: [headerLeft, headerRight],
          margin: [0, 0, 0, 20],
        },
        // TITLE SECTION
        {
          text: title,
          style: "header",
          alignment: "center",
        },
        {
          text: `Ngày, giờ chốt tồn: ${dateTime}`,
          style: "subheader",
          alignment: "center",
        },
        {
          text: `Tổng mặt hàng: ${totalItems}`,
          style: "subheader",
          alignment: "center",
          margin: [0, 0, 0, 15],
        },
        // TABLE
        {
          style: "tableStyle",
          table: {
            headerRows: 1,
            widths: widths,
            body: tableBody,
          },
          layout: {
            hLineWidth: (i, node) =>
              i === 0 || i === node.table.body.length || i === 1 ? 1.5 : 0.5,
            vLineWidth: (i, node) =>
              i === 0 || i === node.table.widths.length ? 1.5 : 0.5,
            hLineColor: () => "#475569",
            vLineColor: () => "#475569",
            paddingLeft: () => 5,
            paddingRight: () => 5,
            paddingTop: () => 5,
            paddingBottom: () => 5,
          },
        },
        // FOOTER SIGNATURES
        {
          columns: [
            {
              text: "Người lập báo cáo\n(Ký, họ tên)",
              alignment: "center",
              bold: true,
              margin: [0, 20, 0, 0],
            },
            {
              stack: [
                {
                  text: `..........................., ngày.......tháng.......năm..........`,
                  italics: true,
                  alignment: "center",
                  margin: [0, 0, 0, 5],
                },
                {
                  text: "Người kiểm tra báo cáo\n(Ký, họ tên)",
                  bold: true,
                  alignment: "center",
                },
              ],
              alignment: "center",
            },
          ],
        },
      ],
      styles: {
        header: {
          fontSize: 20,
          bold: true,
          color: "#1e293b",
          margin: [0, 0, 0, 5],
        },
        subheader: { fontSize: 11, italics: true, color: "#64748b" },
        tableStyle: { fontSize: 10, margin: [0, 5, 0, 15] },
      },
      defaultStyle: { font: "Roboto", color: "#334155" },
    };
  }

  // Hàm cũ
  async _createPdfDocument(materials, title) {
    const tableBody = [
      [
        { text: "STT", bold: true, alignment: "center", fillColor: "#eeeeee" },
        { text: "Mã vật tư", bold: true, fillColor: "#eeeeee" },
        { text: "Tên vật tư", bold: true, fillColor: "#eeeeee" },
        {
          text: "Đơn vị tính",
          bold: true,
          alignment: "center",
          fillColor: "#eeeeee",
        },
        {
          text: "Số lượng tồn",
          bold: true,
          alignment: "right",
          fillColor: "#eeeeee",
        },
      ],
    ];

    const items = Array.isArray(materials)
      ? materials
      : materials
        ? [materials]
        : [];

    items.forEach((item, index) => {
      tableBody.push([
        { text: index + 1, alignment: "center" },
        item.materialCode || item.material_code || "",
        item.materialName || item.material_name || "",
        {
          text: item.unit || item.unit_name || item.material_unit || "",
          alignment: "center",
        },
        {
          text: (item.quantity !== undefined
            ? item.quantity
            : 0
          ).toLocaleString("vi-VN"),
          alignment: "right",
        },
      ]);
    });

    const docDefinition = {
      content: [
        { text: title, style: "header", alignment: "center" },
        {
          text: `Ngày xuất: ${new Date().toLocaleDateString("vi-VN")}`,
          style: "subheader",
          alignment: "right",
          margin: [0, 0, 0, 10],
        },
        {
          style: "tableExample",
          table: {
            headerRows: 1,
            widths: ["10%", "20%", "*", "15%", "15%"],
            body: tableBody,
          },
          layout: {
            hLineWidth: function (i, node) {
              return i === 0 || i === node.table.body.length ? 1.5 : 0.5;
            },
            vLineWidth: function (i, node) {
              return i === 0 || i === node.table.widths.length ? 1.5 : 0.5;
            },
            hLineColor: function () {
              return "#aaaaaa";
            },
            vLineColor: function () {
              return "#aaaaaa";
            },
          },
        },
        {
          text: "\nNguời lập phiếu\n(Ký và ghi rõ họ tên)",
          alignment: "right",
          bold: true,
        },
      ],
      styles: {
        header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
        subheader: { fontSize: 12, italics: true },
        tableExample: { margin: [0, 5, 0, 15], fontSize: 11 },
      },
      defaultStyle: { font: "Roboto" },
    };

    const pdfDoc = pdfmake.createPdf(docDefinition);
    return await pdfDoc.getBuffer();
  }

  // --- BÁO CÁO 3: BÁO GIÁ KỸ THUẬT (Quotation PDF) ---
  async generateQuotationPDF(quotationData) {
    const logoData = this._getLogoBase64();
    const title = quotationData.title || "BÁO GIÁ KỸ THUẬT VÀ GIA CÔNG";
    
    // Format date
    const now = new Date();
    const dateStr = now.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    
    const customerName = quotationData?.users?.user_profiles?.first_name || quotationData?.users?.username || "Khách hàng";
    const customerPhone = quotationData?.users?.user_profiles?.phone_number || "Không có";
    
    const imageBlock = [];
    if (quotationData.main_image_url) {
      imageBlock.push({ image: quotationData.main_image_url, width: 200, alignment: 'center' }); 
    } else {
       imageBlock.push({ text: 'Không có ảnh 3D', alignment: 'center', margin: [0,50,0,50], color: 'gray' });
    }
    
    const blueprintBlock = [];
    if (quotationData.blueprint_image_url) {
      blueprintBlock.push({ image: quotationData.blueprint_image_url, width: 200, alignment: 'center' });
    } else {
       blueprintBlock.push({ text: 'Không có ảnh bản vẽ kỹ thuật', alignment: 'center', margin: [0,50,0,50], color: 'gray' });
    }
    
    // Image columns
    const imageColumns = {
      columns: [
        { stack: [{ text: 'Bản vẽ 3D', alignment: 'center', bold: true, margin: [0,0,0,10] }, ...imageBlock] },
        { stack: [{ text: 'Bản vẽ Nét đứt (Kỹ thuật)', alignment: 'center', bold: true, margin: [0,0,0,10] }, ...blueprintBlock] }
      ],
      margin: [0, 20, 0, 20]
    };
    
    // Table
    const tableHeader = [
      { text: "STT", bold: true, alignment: "center", fillColor: "#e2e8f0" },
      { text: "Tên hạng mục / Linh kiện", bold: true, alignment: "center", fillColor: "#e2e8f0" },
      { text: "Vật tư", bold: true, alignment: "center", fillColor: "#e2e8f0" },
      { text: "Kích thước (mm)", bold: true, alignment: "center", fillColor: "#e2e8f0" },
      { text: "SL", bold: true, alignment: "center", fillColor: "#e2e8f0" },
      { text: "Thành tiền", bold: true, alignment: "center", fillColor: "#e2e8f0" }
    ];
    
    const tableBody = [tableHeader];
    
    if (quotationData.quotation_specs && quotationData.quotation_specs.length > 0) {
      quotationData.quotation_specs.forEach((spec, idx) => {
        const dim = spec.dimensions || {};
        tableBody.push([
          { text: idx + 1, alignment: "center" },
          spec.component_name || "Linh kiện",
          spec.materials?.material_name || "Theo TC",
          { text: `${dim.width || '-'} x ${dim.height || dim.length || '-'}`, alignment: "center" },
          { text: dim.quantity || 1, alignment: "center" },
          { text: Number(spec.snapshot_price || 0).toLocaleString("vi-VN"), alignment: "right" }
        ]);
      });
    } else {
      tableBody.push([{ text: "Không có chi tiết vật tư", colSpan: 6, alignment: "center" }, {}, {}, {}, {}, {}]);
    }
    
    const totalPrice = Number(quotationData.admin_proposed_price || quotationData.total_quoted_price || 0);

    const docDefinition = {
      pageSize: "A4",
      pageMargins: [40, 40, 40, 40],
      content: [
        {
          columns: [
            logoData ? { image: logoData, width: 80 } : { text: "KPM", fontSize: 20, bold: true },
            {
              stack: [
                { text: "CÔNG TY KPM MATERIALS", bold: true, fontSize: 14, alignment: "right" },
                { text: "Mã Báo Giá: #" + String(quotationData.id || "DRAFT").slice(0, 8).toUpperCase(), alignment: "right", italics: true },
                { text: "Ngày báo giá: " + dateStr, alignment: "right", italics: true }
              ]
            }
          ]
        },
        { text: title, style: "header", alignment: "center", margin: [0, 20, 0, 10] },
        {
          text: [
            { text: "Kính gửi Quý khách hàng: ", bold: true }, customerName, "\n",
            { text: "Số điện thoại: ", bold: true }, customerPhone, "\n\n",
            "Công ty KPM xin gửi đến quý khách hàng bảng báo giá gia công theo yêu cầu như sau:"
          ],
          margin: [0, 0, 0, 20]
        },
        imageColumns,
        {
          style: "tableStyle",
          table: {
            headerRows: 1,
            widths: ["auto", "*", "auto", "auto", "auto", "auto"],
            body: tableBody
          },
          layout: 'lightHorizontalLines'
        },
        {
          columns: [
            { text: "", width: "*" },
            {
              width: 250,
              table: {
                widths: ["*", "auto"],
                body: [
                  [{ text: "TỔNG THANH TOÁN:", bold: true, alignment: "right", border: [false, true, false, false] }, { text: totalPrice.toLocaleString("vi-VN") + " VNĐ", bold: true, alignment: "right", border: [false, true, false, false], color: 'red' }]
                ]
              },
              layout: 'noBorders'
            }
          ],
          margin: [0, 10, 0, 20]
        },
        { text: "* Ghi chú: " + (quotationData.note || "Báo giá có giá trị trong vòng 15 ngày."), italics: true, color: 'gray' },
        {
          columns: [
            { text: "Khách hàng xác nhận\n(Ký và ghi rõ họ tên)", alignment: "center", bold: true, margin: [0, 30, 0, 0] },
            { text: "Đại diện KPM\n(Ký và ghi rõ họ tên)", alignment: "center", bold: true, margin: [0, 30, 0, 0] }
          ]
        }
      ],
      styles: {
        header: { fontSize: 18, bold: true, color: "#1e293b" },
        tableStyle: { margin: [0, 5, 0, 15] }
      },
      defaultStyle: { font: "Roboto", fontSize: 11, color: "#334155" }
    };
    
    const pdfDoc = pdfmake.createPdf(docDefinition);
    return await pdfDoc.getBuffer();
  }

  // --- BÁO CÁO 4: HÓA ĐƠN ĐƠN HÀNG (Order Invoice PDF) ---
  async generateOrderInvoicePDF(orderData) {
    const logoData = this._getLogoBase64();
    const title = "HÓA ĐƠN BÁN HÀNG";
    
    const now = new Date();
    const dateStr = now.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    
    const customerName = orderData?.customer_name || orderData?.users?.user_profiles?.first_name || "Khách hàng";
    const customerPhone = orderData?.customer_phone || "Không có";
    const shippingAddress = orderData?.shipping_address || "Tại xưởng";
    
    const tableHeader = [
      { text: "STT", bold: true, alignment: "center", fillColor: "#e2e8f0" },
      { text: "Tên Hàng Hóa / Dịch vụ", bold: true, alignment: "center", fillColor: "#e2e8f0" },
      { text: "SL", bold: true, alignment: "center", fillColor: "#e2e8f0" },
      { text: "Đơn giá", bold: true, alignment: "center", fillColor: "#e2e8f0" },
      { text: "Thành tiền", bold: true, alignment: "center", fillColor: "#e2e8f0" }
    ];
    
    const tableBody = [tableHeader];
    
    let subTotal = 0;
    if (orderData.order_items && orderData.order_items.length > 0) {
      orderData.order_items.forEach((item, idx) => {
        const price = Number(item.price || 0);
        const lineTotal = price * item.quantity;
        subTotal += lineTotal;
        tableBody.push([
          { text: idx + 1, alignment: "center" },
          item.products?.product_name || "Sản phẩm KPM",
          { text: item.quantity, alignment: "center" },
          { text: price.toLocaleString("vi-VN"), alignment: "right" },
          { text: lineTotal.toLocaleString("vi-VN"), alignment: "right" }
        ]);
      });
    } else {
      // Nếu là đơn hàng tạo từ báo giá
      const price = Number(orderData.total_amount || 0);
      subTotal = price;
      tableBody.push([
        { text: 1, alignment: "center" },
        "Sản xuất / Gia công theo Báo giá đính kèm",
        { text: 1, alignment: "center" },
        { text: price.toLocaleString("vi-VN"), alignment: "right" },
        { text: price.toLocaleString("vi-VN"), alignment: "right" }
      ]);
    }
    
    const shippingFee = Number(orderData.shipping_fee || 0);
    const installFee = Number(orderData.installation_fee || 0);
    const depositAmount = Number(orderData.deposit_amount || 0);
    const totalAmount = subTotal + shippingFee + installFee;
    const remainingAmount = totalAmount - depositAmount;

    const docDefinition = {
      pageSize: "A5",
      pageOrientation: "landscape",
      pageMargins: [30, 30, 30, 30],
      content: [
        {
          columns: [
            logoData ? { image: logoData, width: 60 } : { text: "KPM", fontSize: 16, bold: true },
            {
              stack: [
                { text: "CÔNG TY KPM MATERIALS", bold: true, fontSize: 12, alignment: "right" },
                { text: "Mã Đơn: #" + String(orderData.order_code || "DRAFT"), alignment: "right", italics: true },
                { text: "Ngày xuất: " + dateStr, alignment: "right", italics: true }
              ]
            }
          ]
        },
        { text: title, style: "header", alignment: "center", margin: [0, 10, 0, 10] },
        {
          text: [
            { text: "Khách hàng: ", bold: true }, customerName, "\n",
            { text: "Số điện thoại: ", bold: true }, customerPhone, "\n",
            { text: "Địa chỉ: ", bold: true }, shippingAddress
          ],
          margin: [0, 0, 0, 15],
          fontSize: 10
        },
        {
          style: "tableStyle",
          table: {
            headerRows: 1,
            widths: ["auto", "*", "auto", "auto", "auto"],
            body: tableBody
          },
          layout: 'lightHorizontalLines'
        },
        {
          columns: [
            { text: "", width: "*" },
            {
              width: 200,
              table: {
                widths: ["*", "auto"],
                body: [
                  [{ text: "Cộng tiền hàng:", alignment: "right", border: [false, true, false, false], fontSize: 10 }, { text: subTotal.toLocaleString("vi-VN"), alignment: "right", border: [false, true, false, false], fontSize: 10 }],
                  ...(shippingFee > 0 ? [[{ text: "Phí vận chuyển:", alignment: "right", border: [false, false, false, false], fontSize: 10 }, { text: shippingFee.toLocaleString("vi-VN"), alignment: "right", border: [false, false, false, false], fontSize: 10 }]] : []),
                  ...(installFee > 0 ? [[{ text: "Phí lắp đặt:", alignment: "right", border: [false, false, false, false], fontSize: 10 }, { text: installFee.toLocaleString("vi-VN"), alignment: "right", border: [false, false, false, false], fontSize: 10 }]] : []),
                  [{ text: "TỔNG CỘNG:", bold: true, alignment: "right", border: [false, true, false, false], fontSize: 11 }, { text: totalAmount.toLocaleString("vi-VN") + " đ", bold: true, alignment: "right", border: [false, true, false, false], color: 'red', fontSize: 11 }],
                  ...(depositAmount > 0 ? [[{ text: "Đã đặt cọc:", alignment: "right", border: [false, false, false, false], fontSize: 10, color: 'blue' }, { text: "-" + depositAmount.toLocaleString("vi-VN"), alignment: "right", border: [false, false, false, false], fontSize: 10, color: 'blue' }]] : []),
                  ...(depositAmount > 0 ? [[{ text: "CÒN LẠI:", bold: true, alignment: "right", border: [false, true, false, false], fontSize: 11 }, { text: remainingAmount.toLocaleString("vi-VN") + " đ", bold: true, alignment: "right", border: [false, true, false, false], color: 'red', fontSize: 11 }]] : [])
                ]
              },
              layout: 'noBorders'
            }
          ],
          margin: [0, 5, 0, 15]
        },
        {
          columns: [
            { text: "Người mua hàng\n(Ký, họ tên)", alignment: "center", bold: true, fontSize: 10 },
            { text: "Người lập phiếu\n(Ký, họ tên)", alignment: "center", bold: true, fontSize: 10 }
          ]
        }
      ],
      styles: {
        header: { fontSize: 16, bold: true, color: "#1e293b" },
        tableStyle: { margin: [0, 5, 0, 10], fontSize: 10 }
      },
      defaultStyle: { font: "Roboto", fontSize: 10, color: "#334155" }
    };
    
    const pdfDoc = pdfmake.createPdf(docDefinition);
    return await pdfDoc.getBuffer();
  }
}

module.exports = new PdfService();
