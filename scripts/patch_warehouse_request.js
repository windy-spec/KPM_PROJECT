const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/pages/warehouse/WarehouseRequest.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Rename matId to reqKey in Object.entries(reqs) loop
content = content.replace(
  /for \(const \[matId, reqQtyStr\] of Object\.entries\(reqs\)\) \{/g,
  `for (const [reqKey, reqQtyStr] of Object.entries(reqs)) {
            const [matId, thickId] = reqKey.split('_');`
);

// 2. Fix the find method
content = content.replace(
  /const inv = inventoryMap\.find\(i => i\.material_id === matId\);/g,
  `const inv = inventoryMap.find(i => i.material_id === matId && (thickId ? i.thickness_id === thickId : true));`
);

// 3. Fix matName to include thickness value
content = content.replace(
  /const matName = inv \? \`\$\{inv\.materials\?\.material_code\} - \$\{inv\.materials\?\.material_name\}\` : "Vật tư không xác định";/g,
  `let matName = inv ? \`\${inv.materials?.material_code} - \${inv.materials?.material_name}\` : "Vật tư không xác định";
              if (inv?.material_thickness?.thickness_value) {
                  matName += \` (\${inv.material_thickness.thickness_value})\`;
              }`
);

// 4. In missingList.push, ensure material_id is pushed as reqKey
content = content.replace(
  /missingList\.push\(\{[\s\n]*material_id: matId,[\s\n]*material_name: matName,[\s\n]*required: requiredQty,[\s\n]*stock: currentStock,[\s\n]*missing: requiredQty - currentStock[\s\n]*\}\);/g,
  `missingList.push({
                  material_id: reqKey,
                  material_name: matName,
                  required: requiredQty,
                  stock: currentStock,
                  missing: requiredQty - currentStock
              });`
);

// 5. In submit request, we pass items. We need to split reqKey before sending.
content = content.replace(
  /items: selectedMaterials\.map\(matId => \{[\s\n]*const matInfo = missingMaterials\.find\(m => m\.material_id === matId\);[\s\n]*return \{[\s\n]*order_id: selectedOrderId,[\s\n]*material_id: matId,[\s\n]*requested_quantity: matInfo\.missing[\s\n]*\};[\s\n]*\}\)/g,
  `items: selectedMaterials.map(reqKey => {
                    const matInfo = missingMaterials.find(m => m.material_id === reqKey);
                    const [matId, thickId] = reqKey.split('_');
                    return {
                        order_id: selectedOrderId,
                        material_id: matId,
                        thickness_id: thickId || null,
                        requested_quantity: matInfo.missing
                    };
                })`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Updated WarehouseRequest.jsx");
