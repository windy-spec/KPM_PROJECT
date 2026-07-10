const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const parts = await prisma.drawing_parts.findMany();
  for (const part of parts) {
    let newMaterial = part.material_category;
    if (part.component_name.toLowerCase().includes('khung')) {
      newMaterial = 'Thép hình I 200x100';
    } else if (part.component_name.toLowerCase().includes('kính')) {
      newMaterial = 'Kính cường lực 12mm';
    } else if (part.component_name.toLowerCase().includes('vách') || part.component_name.toLowerCase().includes('panel')) {
      newMaterial = 'Panel EPS cách nhiệt 50mm';
    } else if (part.component_name.toLowerCase().includes('mái')) {
      newMaterial = 'Tôn lạnh màu 0.45mm';
    } else if (part.material_category === 'MaiNha-mai-kinh' || part.material_category?.includes('-')) {
      newMaterial = 'Thép mạ kẽm';
    } else if (!part.material_category) {
      newMaterial = 'Vật liệu tiêu chuẩn';
    }
    
    if (newMaterial !== part.material_category) {
      await prisma.drawing_parts.update({
        where: { id: part.id },
        data: { material_category: newMaterial }
      });
      console.log(`Updated ${part.component_name} to ${newMaterial}`);
    }
  }
  console.log("Done");
}

main().catch(console.error).finally(() => prisma.$disconnect());
