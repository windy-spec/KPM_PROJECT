const fs = require('fs');
const path = require('path');

function patchExportRequestsPanel() {
  const filePath = path.join(__dirname, '../frontend/src/components/warehouse/ExportRequestsPanel.jsx');
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(
    /map\[item\.material_id\] = \{[\s\n]*name: item\.materials\?\.material_name \|\| 'V-t t cha xAc `<nh',[\s\n]*stock: parseFloat\(item\.quantity \|\| 0\)[\s\n]*\};/g,
    `const reqKey = item.thickness_id ? \`\${item.material_id}_\${item.thickness_id}\` : item.material_id;
                      let name = item.materials?.material_name || 'Vật tư chưa xác định';
                      if (item.material_thickness?.thickness_value) name += \` (\${item.material_thickness.thickness_value})\`;
                      map[reqKey] = {
                          name: name,
                          stock: parseFloat(item.quantity || 0)
                      };`
  );
  
  fs.writeFileSync(filePath, content, 'utf8');
}

function patchWarehouseRequest() {
  const filePath = path.join(__dirname, '../frontend/src/pages/warehouse/WarehouseRequest.jsx');
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(
      /map\[item\.material_id\] = \{[\s\n]*name: item\.materials\?\.material_name \|\| 'V-t t cha xAc `<nh',[\s\n]*stock: parseFloat\(item\.quantity \|\| 0\)[\s\n]*\};/g,
      `const reqKey = item.thickness_id ? \`\${item.material_id}_\${item.thickness_id}\` : item.material_id;
                        let name = item.materials?.material_name || 'Vật tư chưa xác định';
                        if (item.material_thickness?.thickness_value) name += \` (\${item.material_thickness.thickness_value})\`;
                        map[reqKey] = {
                            name: name,
                            stock: parseFloat(item.quantity || 0)
                        };`
    );
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

patchExportRequestsPanel();
patchWarehouseRequest();
console.log("Patched ExportRequestsPanel and WarehouseRequest");
