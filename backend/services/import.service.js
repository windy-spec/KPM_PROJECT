const ExcelJS = require("exceljs");
const xlsx = require("xlsx");
const path = require("path");
const prisma = require("../models/prisma");
const fs = require("fs");

const PARENT_NAMES = {
  HangRao: "Hàng rào",
  Cua: "Cửa",
  CuaSo: "Cửa sổ",
  MaiNha: "Mái nhà",
  VatDung: "Vật dụng"
};

const slugify = (str) => {
  if (!str) return "";
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, "-");
};

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
    try {
      const fs = require("fs");
      const logoPath = path.join(__dirname, "../templates/logo.png");

      if (fs.existsSync(logoPath)) {
        const logoId = workbook.addImage({
          filename: logoPath,
          extension: "png",
        });

        worksheet.addImage(logoId, {
          tl: { col: 0, row: 0 },
          br: { col: 1, row: 3 },
          editAs: "oneCell",
        });
      } else {
        console.log("❌ Lỗi: Không tìm thấy logo tại", logoPath);
      }
    } catch (err) {
      console.log("❌ Lỗi chèn logo Template:", err.message);
    }
    const categories = await prisma.product_categories.findMany({
      select: { category_code: true },
    });
    const categoryCodes = categories.map((c) => c.category_code);

    if (categoryCodes.length > 0) {
      let hiddenSheet = workbook.getWorksheet("HiddenData");
      if (!hiddenSheet) {
        hiddenSheet = workbook.addWorksheet("HiddenData", { state: "hidden" });
        categoryCodes.forEach((code, index) => {
          hiddenSheet.getCell(`A${index + 1}`).value = code;
        });
      }
      // NẾU HIDDENDATA ĐÃ TỒN TẠI (DO USER TẠO TỪ TRƯỚC), GIỮ NGUYÊN 100% KHÔNG CHẠM VÀO

      const dropdownValidation = {
        type: "list",
        allowBlank: true,
        formulae: [`HiddenData!$A$1:$A$${categoryCodes.length}`],
        showErrorMessage: true,
        errorTitle: "Sai mã danh mục",
        error:
          "Vui lòng chọn đúng mã danh mục có sẵn trong danh sách xổ xuống!",
      };

      // Dropdown từ dòng số 5, áp dụng vào Cột C (Mã danh mục)
      for (let i = 5; i <= 500; i++) {
        worksheet.getCell(`C${i}`).dataValidation = dropdownValidation;
      }
    }
    return workbook;
  }

  // ==========================================
  // TASK-09BE & TASK-10BE: BỘ MÁY ĐỌC FILE
  // ==========================================
  async processImportExcel(fileBuffer, fileName) {
    const workbook = xlsx.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    let headerIndex = -1;
    for (let i = 0; i < Math.min(rows.length, 20); i++) {
      if (
        rows[i] &&
        rows[i][0] &&
        String(rows[i][0]).toLowerCase().includes("mã sản phẩm")
      ) {
        headerIndex = i;
        break;
      }
    }

    if (headerIndex === -1)
      throw new Error(
        "Không nhận diện được form mẫu! Không tìm thấy cột 'Mã sản phẩm'.",
      );

    const dataRows = rows.slice(headerIndex + 1).map((row) => ({
      product_code: (row[0] || "").toString().trim(),
      product_name: (row[1] || "").toString().trim(),
      category_code: (row[2] || "").toString().trim(),
      category_name: (row[3] || "").toString().trim(),
      default_specs: (row[4] || "").toString().trim(),
      components: (row[5] || "").toString().trim(),
      price_adjustment: (row[6] || "").toString().trim(),
      primary_image_url: (row[7] || "").toString().trim(),
      other_image_urls: (row[8] || "").toString().trim(),
      base_price: (row[9] || "").toString().trim(),
    }));

    const batch = await prisma.import_batches.create({
      data: {
        batch_type: "EXCEL_PRODUCT",
        status: "PENDING",
        file_name: fileName,
      },
    });

    const allProducts = await prisma.products.findMany({
      select: { product_code: true },
    });
    const dbProductCodes = new Set(allProducts.map((p) => p.product_code));

    // Lấy danh mục hiện tại để đối chiếu
    const allCategories = await prisma.product_categories.findMany({
      select: { id: true, category_code: true },
    });
    const categoryMap = new Map();
    allCategories.forEach((c) => categoryMap.set(c.category_code, c.id));

    const excelProductCodes = new Set();
    const recordsToInsert = [];

    for (const row of dataRows) {
      if (!row.product_code && !row.product_name && !row.category_code)
        continue;

      let validation_errors = {};
      let is_invalid = false;
      let mapped_category_id = null;
      let is_new_category = false; // Cờ đánh dấu danh mục cần tạo mới

      if (!row.product_code) {
        validation_errors.product_code = "Mã sản phẩm trống";
        is_invalid = true;
      }
      if (!row.product_name) {
        validation_errors.product_name = "Tên sản phẩm trống";
        is_invalid = true;
      }

      // CƠ CHẾ MỚI: Tự động ghi nhận tạo danh mục nếu chưa có
      let parentCode = row.category_code;
      let childName = row.category_name;
      let childCode = null;

      if (!parentCode) {
        validation_errors.category_code = "Mã danh mục cha trống";
        is_invalid = true;
      } else if (!childName) {
        validation_errors.category_name = "Tên danh mục con trống";
        is_invalid = true;
      } else {
        childCode = `${parentCode}-${slugify(childName)}`;
        if (categoryMap.has(childCode)) {
          mapped_category_id = categoryMap.get(childCode); // Đã có trong DB
        } else {
          is_new_category = true; // Chưa có, đánh dấu để tạo sau
        }
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

      if (row.default_specs) {
        try {
          JSON.parse(row.default_specs);
        } catch (e) {
          validation_errors.default_specs = "Cú pháp thông số lỗi";
          is_invalid = true;
        }
      }
      if (row.components) {
        try {
          JSON.parse(row.components);
        } catch (e) {
          validation_errors.components = "Cú pháp thành phần cấu tạo lỗi";
          is_invalid = true;
        }
      }

      recordsToInsert.push({
        batch_id: batch.id,
        raw_data: JSON.stringify({
          ...row,
          category_id: mapped_category_id,
          is_new_category,
          child_category_code: childCode,
        }),
        validation_status: is_invalid ? "INVALID" : "VALID",
        validation_errors: is_invalid ? validation_errors : null,
      });
    }

    await prisma.product_imports_tmp.createMany({ data: recordsToInsert });
    return { batch_id: batch.id, total_rows: recordsToInsert.length };
  }
  // ==========================================
  // GIAI ĐOẠN 4: REVIEW & APPROVE
  // ==========================================
  async getBatchDetails(batchId) {
    const batch = await prisma.import_batches.findUnique({
      where: { id: batchId },
      include: { product_imports_tmp: { orderBy: { created_at: "asc" } } },
    });

    if (!batch) throw new Error("Không tìm thấy lô nhập dữ liệu này!");

    const formattedRows = batch.product_imports_tmp.map((item) => ({
      id: item.id,
      validation_status: item.validation_status,
      validation_errors: item.validation_errors,
      data: JSON.parse(item.raw_data),
    }));

    return {
      batch_id: batch.id,
      batch_type: batch.batch_type,
      status: batch.status,
      created_at: batch.created_at,
      rows: formattedRows,
    };
  }

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
      include: { product_imports_tmp: true },
    });

    if (!batch) throw new Error("Lô nhập không tồn tại!");
    if (batch.status !== "PENDING") throw new Error("Lô này đã được xử lý!");

    const validRows = batch.product_imports_tmp.filter(
      (r) => r.validation_status === "VALID",
    );
    if (validRows.length === 0)
      throw new Error("Không có dòng nào hợp lệ để duyệt!");

    return await prisma.$transaction(
      async (tx) => {
        // BƯỚC 1: LỌC TÌM VÀ TẠO CÁC DANH MỤC MỚI (TẠO THÀNH CÁC DANH MỤC CON)
        const newCategoryMap = new Map(); // Dùng để nhớ ID vừa tạo {childCode: id}
        const parentMapCache = new Map(); // Cache parent ID {parentCode: id}

        // Tải sẵn các parent category hiện có
        const existingParents = await tx.product_categories.findMany({
          where: { parent_id: null },
        });
        existingParents.forEach(p => parentMapCache.set(p.category_code, p.id));

        for (const item of validRows) {
          const rowData = JSON.parse(item.raw_data);

          if (rowData.is_new_category && !newCategoryMap.has(rowData.child_category_code)) {
            let parentCode = rowData.category_code;
            let parentId = parentMapCache.get(parentCode);

            // Tự động tạo Parent nếu chưa tồn tại
            if (!parentId) {
              const createdParent = await tx.product_categories.create({
                data: {
                  category_code: parentCode,
                  category_name: PARENT_NAMES[parentCode] || parentCode,
                  parent_id: null,
                },
              });
              parentId = createdParent.id;
              parentMapCache.set(parentCode, parentId);
            }

            // Tạo Child Category
            const createdChild = await tx.product_categories.create({
              data: {
                category_code: rowData.child_category_code,
                category_name: rowData.category_name, // Tên danh mục con
                parent_id: parentId,
              },
            });
            newCategoryMap.set(rowData.child_category_code, createdChild.id);
          }
        }

        // BƯỚC 2: TIẾN HÀNH DUYỆT VÀ TẠO SẢN PHẨM VỚI DỮ LIỆU ĐÃ PHÂN RÃ
        for (const item of validRows) {
          const rowData = JSON.parse(item.raw_data);

          // Lấy category_id cũ (nếu có sẵn) hoặc category_id vừa mới tạo nóng ở Bước 1
          const finalCategoryId =
            rowData.category_id || newCategoryMap.get(rowData.child_category_code);

          // Bóc tách JSON an toàn
          let parsedComponents = [];
          let parsedSpecs = {};
          if (rowData.components)
            parsedComponents = JSON.parse(rowData.components);
          if (rowData.default_specs)
            parsedSpecs = JSON.parse(rowData.default_specs);

          const parsedPriceAdjustment = (rowData.price_adjustment && !isNaN(parseFloat(rowData.price_adjustment)))
            ? parseFloat(rowData.price_adjustment)
            : 0;

          const parsedBasePrice = (rowData.base_price && !isNaN(parseFloat(rowData.base_price)))
            ? parseFloat(rowData.base_price)
            : 0;

          const newProduct = await tx.products.create({
            data: {
              product_code: rowData.product_code,
              product_name: rowData.product_name,
              category_id: finalCategoryId, // Đã liên kết với danh mục con
              default_specs: parsedSpecs, // Đã phân rã thành JSON Object
              components: parsedComponents, // Đã phân rã mảng dữ liệu (Hiển thị UI)
              price_adjustment: parsedPriceAdjustment,
              base_price: parsedBasePrice,
            },
          });

          // Xử lý lưu link ảnh...
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

        // Xóa bộ đệm và chốt lô
        return await tx.import_batches.update({
          where: { id: batchId },
          data: { status: "APPROVED" },
        });
      },
      {
        maxWait: 10000, // Đợi kết nối DB tối đa 10s
        timeout: 120000, // CHO PHÉP CHẠY TỐI ĐA 2 PHÚT (120,000 ms) MỚI TIMEOUT
      },
    );
  }

  // ==========================================
  // TASK-17BE: XUẤT FILE EXCEL CHỨA CÁC DÒNG LỖI (INVALID)
  // ==========================================
  async exportInvalidRows(batchId) {
    const batch = await prisma.import_batches.findUnique({
      where: { id: batchId },
      include: {
        product_imports_tmp: {
          where: { validation_status: "INVALID" },
          orderBy: { created_at: "asc" },
        },
      },
    });

    if (!batch) throw new Error("Lô nhập không tồn tại!");
    if (batch.product_imports_tmp.length === 0)
      throw new Error(
        "Lô này không có dòng dữ liệu nào bị lỗi để xuất! Hãy kiểm tra lại.",
      );

    const workbook = new ExcelJS.Workbook();
    // ✅ ĐÃ SỬA: Dùng __dirname để tìm template chuẩn xác từ thư mục chứa file service
    const templatePath = path.join(
      __dirname,
      "../templates/KPM_Import_Product.xlsx",
    );

    // Nếu file template không tồn tại, văng lỗi ngay để dễ debug
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Không tìm thấy file mẫu tại: ${templatePath}`);
    }

    await workbook.xlsx.readFile(templatePath);
    const worksheet = workbook.worksheets[0];

    try {
      // ✅ ĐÃ SỬA: Dùng __dirname cho logo giống y như hàm generateProductTemplate
      const logoPath = path.join(__dirname, "../templates/logo.png");

      if (fs.existsSync(logoPath)) {
        const logoId = workbook.addImage({
          filename: logoPath,
          extension: "png",
        });

        worksheet.addImage(logoId, {
          tl: { col: 0, row: 0 },
          br: { col: 1, row: 3 },
          editAs: "oneCell",
        });
      } else {
        console.log("❌ [LỖI] Không tìm thấy file logo tại:", logoPath);
      }
    } catch (err) {
      console.error(
        "❌ [CRASH EXCELJS] Lỗi trong quá trình xử lý ảnh:",
        err.message,
      );
    }

    const errorHeaderCell = worksheet.getCell("K4");
    errorHeaderCell.value =
      "🚨 CHI TIẾT LỖI (SỬA XONG CÓ THỂ UP LẠI NGUYÊN FILE NÀY)";
    errorHeaderCell.font = { bold: true, color: { argb: "FFFFFF" } };
    errorHeaderCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "C00000" },
    };

    worksheet.getColumn("K").width = 50;
    worksheet.getColumn("K").alignment = { wrapText: true, vertical: "middle" };

    // --- FIX EXCELS SHARED FORMULA BUG ---
    // spliceRows của exceljs bị lỗi không xóa sạch các clone của Shared Formula.
    // Cách an toàn nhất là lặp qua tất cả các cell ở các dòng mẫu và reset cứng nó.
    for (let r = 5; r <= 1000; r++) {
      const row = worksheet.getRow(r);
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.value = null;
      });
    }

    let currentRow = 5;
    batch.product_imports_tmp.forEach((item) => {
      const rowData = JSON.parse(item.raw_data);
      const errors = item.validation_errors;

      let errorString = "";
      if (errors) {
        errorString = Object.values(errors)
          .map((err) => `• ${err}`)
          .join("\n");
      }

      worksheet.getRow(currentRow).values = [
        rowData.product_code, // Cột A
        rowData.product_name, // Cột B
        rowData.category_code, // Cột C
        rowData.category_name, // Cột D
        rowData.default_specs, // Cột E
        rowData.components, // Cột F
        rowData.price_adjustment, // Cột G
        rowData.primary_image_url, // Cột H
        rowData.other_image_urls, // Cột I
        rowData.base_price, // Cột J
        errorString, // Cột K
      ];
      currentRow++;
    });

    return workbook;
  }

  // TASK-18BE: XÓA VẬT LÝ LÔ HÀNG
  async deleteBatch(batchId) {
    const batch = await prisma.import_batches.findUnique({
      where: { id: batchId },
    });
    if (!batch) throw new Error("Lô nhập không tồn tại!");

    return await prisma.$transaction(async (tx) => {
      await tx.product_imports_tmp.deleteMany({ where: { batch_id: batchId } });
      return await tx.import_batches.delete({ where: { id: batchId } });
    });
  }

  async getAllBatches(limit = 200) {
    const batches = await prisma.import_batches.findMany({
      take: limit,
      orderBy: { created_at: "desc" },
      include: { product_imports_tmp: { select: { validation_status: true } } },
    });

    const formattedBatches = batches.map((batch) => {
      const total_rows = batch.product_imports_tmp.length;
      const invalid_count = batch.product_imports_tmp.filter(
        (row) => row.validation_status === "INVALID",
      ).length;
      const valid_count = total_rows - invalid_count;

      delete batch.product_imports_tmp;

      return { ...batch, total_rows, valid_count, invalid_count };
    });

    return formattedBatches;
  }
}

module.exports = new ImportService();
