const pdfmake = require("pdfmake");
const path = require("path");

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

// Tắt các warning log của pdfmake về policy bảo mật (No URL/Local access policy defined)
pdfmake.setUrlAccessPolicy(() => false);
pdfmake.setLocalAccessPolicy(() => false);

class PdfService {
  // Chuyển logic sinh PDF thành 1 method nhận mảng vật tư và trả về Buffer (bất đồng bộ)
  async generateWarehousePDF(materials) {
    return this._createPdfDocument(materials, "PHIẾU XUẤT KHO VẬT TƯ");
  }

  // Method mới để xuất Báo cáo Tồn kho
  async generateInventoryReportPDF(materials) {
    return this._createPdfDocument(materials, "BÁO CÁO TỒN KHO VẬT TƯ");
  }

  // Hàm private để tái sử dụng logic vẽ bảng
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
}

module.exports = new PdfService();
