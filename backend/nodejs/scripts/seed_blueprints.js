const prisma = require("../models/prisma");


async function seed() {
  console.log("Setup Role Kho...");
  
  // Create admin_kho role if it doesn't exist
  let khoRole = await prisma.roles.findUnique({ where: { role_name: "admin_kho" } });
  if (!khoRole) {
    khoRole = await prisma.roles.create({
      data: {
        role_name: "admin_kho",
        description: "Quản trị viên Kho (Warehouse Manager)"
      }
    });
    console.log("Created admin_kho role.");
  } else {
    console.log("Role admin_kho already exists.");
  }

  console.log("Seeding Blueprints...");
  const CATEGORY_BLUEPRINTS = require("../../../update_blueprints.js");
  for (const [categoryCode, comps] of Object.entries(CATEGORY_BLUEPRINTS)) {
    for (const comp of comps) {
      const materials = await prisma.materials.findMany({
        where: { material_code: { in: comp.allowed_materials || [] } }
      });
      const materialIds = materials.map(m => m.id);

      await prisma.component_templates.create({
        data: {
          component_name: comp.name,
          category_code: categoryCode,
          default_length: comp.length,
          default_width: comp.width,
          default_height: comp.height,
          default_unit: comp.unit,
          allow_paint: comp.allow_paint,
          allowed_materials: {
            create: materialIds.map(id => ({ material_id: id }))
          }
        }
      });
    }
  }
  console.log("Seeding Blueprints completed!");
}

seed().catch(console.error).finally(() => prisma.$disconnect());
