const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../backend/services/order.service.js');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /const matId = comp\.material_id;/g,
  `const matId = comp.material_id;
          const thickId = comp.thickness_id;
          const reqKey = thickId ? \`\${matId}_\${thickId}\` : matId;`
);

content = content.replace(
  /if \(!requiredMaterials\[matId\]\) requiredMaterials\[matId\] = 0;\s*requiredMaterials\[matId\] \+= consumedQty;/g,
  `if (!requiredMaterials[reqKey]) requiredMaterials[reqKey] = 0;
            requiredMaterials[reqKey] += consumedQty;`
);

content = content.replace(
  /const matId = spec\.material_id;/g,
  `const matId = spec.material_id;
          const thickId = spec.thickness_id;
          const reqKey = thickId ? \`\${matId}_\${thickId}\` : matId;`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Updated order.service.js");
