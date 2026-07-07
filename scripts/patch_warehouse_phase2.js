const fs = require('fs');
const path = require('path');

function patchWarehouseService() {
  const filePath = path.join(__dirname, '../backend/services/warehouse.service.js');
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix order check loop in requestImportMaterials
  content = content.replace(
    /for \(const \[matId, reqQtyStr\] of Object\.entries\(reqs\)\) \{[\s\n]*const reqQty = parseFloat\(reqQtyStr\);[\s\n]*const matInv = await tx\.inventory\.findFirst\(\{[\s\n]*where: \{ material_id: matId \},[\s\n]*\}\);/g,
    `for (const [key, reqQtyStr] of Object.entries(reqs)) {
              const [matId, thickId] = key.split('_');
              const reqQty = parseFloat(reqQtyStr);
              let whereClause = { material_id: matId };
              if (thickId) whereClause.thickness_id = thickId;
              else whereClause.thickness_id = null; // Hoặc bỏ check nếu muốn tuỳ ý

              const matInv = await tx.inventory.findFirst({
                where: whereClause,
              });`
  );

  // Fix getMissingMaterialsForPDF
  content = content.replace(
    /for \(const \[matId, requiredQtyStr\] of Object\.entries\(requiredMaterials\)\) \{[\s\n]*const requiredQty = parseFloat\(requiredQtyStr\);[\s\n]*\/\/ Cần include thêm bảng materials và material_units để lấy tên và đơn vị tính[\s\n]*const inv = await prisma\.inventory\.findFirst\(\{[\s\n]*where: \{ material_id: matId \},/g,
    `for (const [key, requiredQtyStr] of Object.entries(requiredMaterials)) {
        const [matId, thickId] = key.split('_');
        const requiredQty = parseFloat(requiredQtyStr);
        let whereClause = { material_id: matId };
        if (thickId) whereClause.thickness_id = thickId;
        else whereClause.thickness_id = null;

        const inv = await prisma.inventory.findFirst({
          where: whereClause,`
  );

  content = content.replace(
    /material_code: inv\?\.materials\?\.material_code \|\| matId,/g,
    `material_code: inv?.materials?.material_code || matId,`
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Updated warehouse.service.js for Phase 2");
}

function patchMaterialRequestService() {
  const filePath = path.join(__dirname, '../backend/services/material_request.service.js');
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(
    /for \(const \[matId, reqQtyStr\] of Object\.entries\(reqs\)\) \{[\s\n]*const reqQty = parseFloat\(reqQtyStr\);[\s\n]*const inv = await tx\.inventory\.findUnique\(\{ where: \{ material_id: matId \} \}\);/g,
    `for (const [key, reqQtyStr] of Object.entries(reqs)) {
                  const [matId, thickId] = key.split('_');
                  const reqQty = parseFloat(reqQtyStr);
                  let whereClause = { material_id: matId };
                  if (thickId) whereClause.thickness_id = thickId;
                  else whereClause.thickness_id = null;
                  const inv = await tx.inventory.findFirst({ where: whereClause });`
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Updated material_request.service.js for Phase 2");
}

patchWarehouseService();
patchMaterialRequestService();
