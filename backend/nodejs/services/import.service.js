const ExcelJS = require("exceljs");
const xlsx = require("xlsx");
const path = require("path");
const prisma = require("../models/prisma");

class ImportService {
  // ==========================================
  // TASK-07BE: XUẤT TEMPLATE IMPORT SẢN PHẨM
  // ==========================================
  async generateProductTemplate() {
    const workbook = new ExcelJS.Workbook();
    const templatePath = path.join(
      __dirname,
      "../templates/KPM_Import_Product.xlsx",
    );
    await workbook.xlsx.readFile(templatePath);
    const worksheet = workbook.worksheets[0];

    const categories = await prisma.product_categories.findMany({
      select: { category_code: true },
    });
    const categoryCodes = categories.map((c) => c.category_code);

    if (categoryCodes.length > 0) {
      let hiddenSheet = workbook.getWorksheet("HiddenData");
      if (!hiddenSheet) {
        hiddenSheet = workbook.addWorksheet("HiddenData", { state: "hidden" });
      } else {
        hiddenSheet.spliceRows(1, hiddenSheet.rowCount);
      }
      categoryCodes.forEach((code, index) => {
        hiddenSheet.getCell(`A${index + 1}`).value = code;
      });

      const dropdownValidation = {
        type: "list",
        allowBlank: true,
        formulae: [`HiddenData!$A$1:$A$${categoryCodes.length}`],
        showErrorMessage: true,
        errorTitle: "Sai mã danh mục",
        error:
          "Vui lòng chọn đúng mã danh mục có sẵn trong danh sách xổ xuống!",
      };

      for (let i = 2; i <= 500; i++) {
        worksheet.getCell(`C${i}`).dataValidation = dropdownValidation;
      }
    }
    return workbook;
  }

  // ==========================================
  // TASK-09BE & TASK-10BE: BỘ MÁY ĐỌC FILE (ĐÃ FIX MAPPING)
  // ==========================================
  async processImportExcel(fileBuffer) {
    const workbook = xlsx.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Sử dụng header: 1 để đọc theo mảng, sau đó tự map index
    const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    if (rows.length <= 1) throw new Error("File Excel không có dữ liệu!");

    // Loại bỏ dòng Header (dòng đầu tiên) và map lại các dòng dữ liệu
    const dataRows = rows.slice(1).map((row) => ({
      product_code: (row[0] || "").toString().trim(),
      product_name: (row[1] || "").toString().trim(),
      category_code: (row[2] || "").toString().trim(),
      default_specs: (row[3] || "").toString().trim(),
      primary_image_url: (row[4] || "").toString().trim(),
      other_image_urls: (row[5] || "").toString().trim(),
    }));

    const batch = await prisma.import_batches.create({
      data: { batch_type: "EXCEL_PRODUCT", status: "PENDING" },
    });

    const allProducts = await prisma.products.findMany({
      select: { product_code: true },
    });
    const dbProductCodes = new Set(allProducts.map((p) => p.product_code));

    const allCategories = await prisma.product_categories.findMany({
      select: { id: true, category_code: true },
    });
    const categoryMap = new Map();
    allCategories.forEach((c) => categoryMap.set(c.category_code, c.id));

    const excelProductCodes = new Set();
    const recordsToInsert = [];

    for (const row of dataRows) {
      // Bỏ qua dòng trống
      if (!row.product_code && !row.product_name && !row.category_code)
        continue;

      let validation_errors = {};
      let is_invalid = false;
      let mapped_category_id = null;

      // Validate
      if (!row.product_code) {
        validation_errors.product_code = "Mã sản phẩm trống";
        is_invalid = true;
      }
      if (!row.product_name) {
        validation_errors.product_name = "Tên sản phẩm trống";
        is_invalid = true;
      }

      if (!row.category_code) {
        validation_errors.category_code = "Mã danh mục trống";
        is_invalid = true;
      } else if (!categoryMap.has(row.category_code)) {
        validation_errors.category_code = `Mã '${row.category_code}' không tồn tại`;
        is_invalid = true;
      } else {
        mapped_category_id = categoryMap.get(row.category_code);
      }

      if (row.product_code) {
        if (excelProductCodes.has(row.product_code)) {
          validation_errors.product_code = "Mã bị lặp trong file";
          is_invalid = true;
        } else {
          excelProductCodes.add(row.product_code);
        }
        if (dbProductCodes.has(row.product_code)) {
          validation_errors.product_code = "Mã đã tồn tại trong DB";
          is_invalid = true;
        }
      }

      recordsToInsert.push({
        batch_id: batch.id,
        raw_data: JSON.stringify({ ...row, category_id: mapped_category_id }),
        validation_status: is_invalid ? "INVALID" : "VALID",
        validation_errors: is_invalid ? validation_errors : null,
      });
    }

    await prisma.product_imports_tmp.createMany({ data: recordsToInsert });
    return { batch_id: batch.id, total_rows: recordsToInsert.length };
  }

  // ==========================================
  // GIAI ĐOẠN 4: REVIEW & APPROVE (CÁC HÀM BỊ THIẾU NÃY ĐÂY BRO)
  // ==========================================

  // TASK-11BE: LẤY CHI TIẾT LÔ ĐỆM ĐỂ LÊN BẢNG REVIEW
  async getBatchDetails(batchId) {
    const batch = await prisma.import_batches.findUnique({
      where: { id: batchId },
      include: {
        product_imports_tmp: { orderBy: { created_at: "asc" } },
      },
    });

    if (!batch) throw new Error("Không tìm thấy lô nhập dữ liệu này!");

    const formattedRows = batch.product_imports_tmp.map((item) => {
      return {
        id: item.id,
        validation_status: item.validation_status,
        validation_errors: item.validation_errors,
        data: JSON.parse(item.raw_data),
      };
    });

    return {
      batch_id: batch.id,
      batch_type: batch.batch_type,
      status: batch.status,
      created_at: batch.created_at,
      rows: formattedRows,
    };
  }

  // TASK-13BE: TỪ CHỐI / HỦY LÔ NHẬP ĐỆM
  async rejectBatch(batchId) {
    const batch = await prisma.import_batches.findUnique({
      where: { id: batchId },
    });
    if (!batch) throw new Error("Lô nhập không tồn tại!");
    if (batch.status !== "PENDING")
      throw new Error("Lô này đã được xử lý trước đó, không thể hủy!");

    return await prisma.import_batches.update({
      where: { id: batchId },
      data: { status: "REJECTED" },
    });
  }

  // TASK-15BE: CHỐT DUYỆT - ĐẨY DATA VÀO DATABASE CHÍNH
  async approveBatch(batchId) {
    const batch = await prisma.import_batches.findUnique({
      where: { id: batchId },
      include: {
        product_imports_tmp: { where: { validation_status: "VALID" } },
      },
    });

    if (!batch) throw new Error("Lô nhập không tồn tại!");
    if (batch.status !== "PENDING")
      throw new Error("Lô này đã được xử lý trước đó!");
    if (batch.product_imports_tmp.length === 0)
      throw new Error("Không có dòng nào hợp lệ trong lô này để duyệt!");

    return await prisma.$transaction(async (tx) => {
      for (const item of batch.product_imports_tmp) {
        const rowData = JSON.parse(item.raw_data);

        const newProduct = await tx.products.create({
          data: {
            product_code: rowData.product_code,
            product_name: rowData.product_name,
            category_id: rowData.category_id,
            default_specs: rowData.default_specs
              ? JSON.parse(rowData.default_specs)
              : null,
          },
        });

        let imageRecords = [];
        if (rowData.primary_image_url) {
          imageRecords.push({
            product_id: newProduct.id,
            image_url: rowData.primary_image_url,
            is_primary: true,
          });
        }

        if (rowData.other_image_urls) {
          const urls = rowData.other_image_urls
            .split(",")
            .map((url) => url.trim())
            .filter((url) => url !== "");
          urls.forEach((url) => {
            imageRecords.push({
              product_id: newProduct.id,
              image_url: url,
              is_primary: false,
            });
          });
        }

        if (imageRecords.length > 0) {
          await tx.product_images.createMany({ data: imageRecords });
        }
      }

      return await tx.import_batches.update({
        where: { id: batchId },
        data: { status: "APPROVED" },
      });
    });
  }
}

module.exports = new ImportService();
