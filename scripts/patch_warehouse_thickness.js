const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../backend/services/warehouse.service.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. requestImportMaterials
content = content.replace(
  /material_id: item\.material_id,/g,
  `material_id: item.material_id,
        thickness_id: item.thickness_id || null,`
);

// 2. confirmImportRequest
content = content.replace(
  /const inv = await tx\.inventory\.findFirst\(\{ where: \{ material_id: request\.material_id \} \}\);/g,
  `let whereClause = { material_id: request.material_id };
        if (request.thickness_id) whereClause.thickness_id = request.thickness_id;
        else whereClause.thickness_id = null;
        const inv = await tx.inventory.findFirst({ where: whereClause });`
);

content = content.replace(
  /const existingInv = await tx\.inventory\.findFirst\(\{ where: \{ material_id: request\.material_id \} \}\);/g,
  `const existingInv = await tx.inventory.findFirst({ where: whereClause });`
);

content = content.replace(
  /material_id: request\.material_id,[\s\n]*quantity: inventory_after/g,
  `material_id: request.material_id,
            thickness_id: request.thickness_id || null,
            quantity: inventory_after`
);

content = content.replace(
  /material_id: request\.material_id,[\s\n]*action_type: "IMPORT"/g,
  `material_id: request.material_id,
            thickness_id: request.thickness_id || null,
            action_type: "IMPORT"`
);

// 3. deleteInventory
content = content.replace(
  /material_id: inventory\.material_id,[\s\n]*action_type: "DELETE"/g,
  `material_id: inventory.material_id,
            thickness_id: inventory.thickness_id || null,
            action_type: "DELETE"`
);

// 4. updateInventory
content = content.replace(
  /material_id: inventory\.material_id,[\s\n]*action_type: "MANUAL_ADJUST"/g,
  `material_id: inventory.material_id,
            thickness_id: inventory.thickness_id || null,
            action_type: "MANUAL_ADJUST"`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Updated warehouse.service.js logic for thickness_id");
