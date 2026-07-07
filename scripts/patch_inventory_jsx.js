const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/pages/warehouse/WarehouseInventory.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Update selectedIds logic to use item.id instead of item.material_id
content = content.replace(
  /const handleSelectRow = \(materialId\) => \{/g,
  `const handleSelectRow = (id) => {`
);

content = content.replace(
  /prev\.includes\(materialId\)\s*\?\s*prev\.filter\(\(id\) => id !== materialId\)\s*:\s*\[\.\.\.prev, materialId\]/g,
  `prev.includes(id) ? prev.filter((_id) => _id !== id) : [...prev, id]`
);

content = content.replace(
  /\.map\(\(item\) => item\.material_id\)/g,
  `.map((item) => item.id)`
);

content = content.replace(
  /paginatedInventory\.every\(\(item\) => selectedIds\.includes\((?:item\.)?material_id\)\)/g,
  `paginatedInventory.every((item) => selectedIds.includes(item.id))`
);

content = content.replace(
  /checked=\{selectedIds\.includes\((?:item\.)?material_id\)\}/g,
  `checked={selectedIds.includes(item.id)}`
);

content = content.replace(
  /onChange=\{\(\) => handleSelectRow\((?:item\.)?material_id\)\}/g,
  `onChange={() => handleSelectRow(item.id)}`
);

// Show thickness info in table
content = content.replace(
  /\{item\.materials\?\.material_name \|\| "Vật tư không xác định"\}/g,
  `{item.materials?.material_name || "Vật tư không xác định"} {item.material_thickness?.thickness_value ? \`(\${item.material_thickness.thickness_value})\` : ""}`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Updated WarehouseInventory.jsx");
