require('dotenv').config({ path: '../backend/.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const materials = await prisma.materials.findMany();
  
  const rules = [
    { codeMatch: /TON_MA_MAU/i, nameMatch: /Tôn lợp/, thicknesses: ['0.35', '0.4', '0.45', '0.5'], mult: [0.85, 1, 1.15, 1.3] },
    { codeMatch: /CEMBOARD/i, nameMatch: /Cemboard/, thicknesses: ['14', '16', '18', '20'], mult: [0.8, 0.9, 1, 1.2] },
    { codeMatch: /NHOM_XF_55/i, nameMatch: /Nhôm Xingfa/, thicknesses: ['1.4', '2.0'], mult: [1, 1.4] },
    { codeMatch: /SLA_30/i, nameMatch: /Thép La/, thicknesses: ['30', '40', '50'], mult: [1, 1.3, 1.6] },
    { codeMatch: /TON_DECKING/i, nameMatch: /Tôn đổ sàn/, thicknesses: ['0.58', '0.75', '0.95', '1.15'], mult: [0.8, 1, 1.3, 1.6] },
  ];

  let added = 0;
  for (const mat of materials) {
    for (const rule of rules) {
      if ((mat.material_code && rule.codeMatch.test(mat.material_code)) || rule.nameMatch.test(mat.material_name)) {
        console.log(`Matched: ${mat.material_name}`);
        // Add thicknesses if not exists
        for (let i = 0; i < rule.thicknesses.length; i++) {
          const val = rule.thicknesses[i];
          const mult = rule.mult[i];
          const existing = await prisma.material_thickness.findFirst({
            where: { material_id: mat.id, thickness_value: val }
          });
          if (!existing) {
            await prisma.material_thickness.create({
              data: {
                material_id: mat.id,
                thickness_value: val,
                price_multiplier: mult.toString()
              }
            });
            added++;
            console.log(` - Added thickness ${val}mm (x${mult})`);
          }
        }
      }
    }
  }
  console.log(`Finished adding ${added} thickness records.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
