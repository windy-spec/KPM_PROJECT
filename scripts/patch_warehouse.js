const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../backend/services/warehouse.service.js');
let content = fs.readFileSync(filePath, 'utf8');

// Replace findUnique on inventory with findFirst (where it only uses material_id)
content = content.replace(/tx\.inventory\.findUnique\(\{[\s\n]*where: \{ material_id: (.*?) \}[,\s\n]*\}\)/g, 
  'tx.inventory.findFirst({ where: { material_id: $1 } })');

content = content.replace(/prisma\.inventory\.findUnique\(\{[\s\n]*where: \{ material_id: (.*?) \}(.*?)\}\)/g, 
  'prisma.inventory.findFirst({ where: { material_id: $1 }$2})');

// Fix upsert on inventory which only uses material_id
content = content.replace(/\/\/ 3\. Update inventory[\s\n]*await tx\.inventory\.upsert\(\{[\s\n]*where: \{ material_id: request\.material_id \},[\s\n]*update: \{ quantity: inventory_after \},[\s\n]*create: \{[\s\n]*material_id: request\.material_id,[\s\n]*quantity: inventory_after,[\s\n]*\},[\s\n]*\}\);/gm,
`// 3. Update inventory
      const existingInv = await tx.inventory.findFirst({ where: { material_id: request.material_id } });
      if (existingInv) {
        await tx.inventory.update({
          where: { id: existingInv.id },
          data: { quantity: inventory_after }
        });
      } else {
        await tx.inventory.create({
          data: {
            material_id: request.material_id,
            quantity: inventory_after
          }
        });
      }`);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Updated warehouse.service.js");
