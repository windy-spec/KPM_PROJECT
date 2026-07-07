const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/components/quotation/CustomQuoteForm.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove adminService.getMaterialThickness()
content = content.replace(
  /const \[prodRes, matRes, thRes, paintRes, bpRes\] = await Promise\.all\(\[[\s\S]*?adminService\.getMaterialThickness\(\),[\s\S]*?\]\);/,
  `const [prodRes, matRes, paintRes, bpRes] = await Promise.all([
          productService.getProducts({ page: 1, limit: 200 }),
          adminService.getMaterials({ page: 1, limit: 500 }),
          adminService.getPaintTypes(),
          apiClient.get("/component-templates"),
        ]);`
);

content = content.replace(
  /setThicknessList\(thRes\.data\?\.data \|\| thRes\.data \|\| \[\]\);/g,
  `const allMats = matRes.data?.data || matRes.data || [];
        const extractedThicknesses = [];
        allMats.forEach(m => {
          if (m.material_thickness && Array.isArray(m.material_thickness)) {
            m.material_thickness.forEach(t => {
              extractedThicknesses.push(t);
            });
          }
        });
        setThicknessList(extractedThicknesses);`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Updated CustomQuoteForm.jsx");
