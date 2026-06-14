const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const categories = await prisma.product_categories.findMany({ where: { parent_id: null } });
  console.log(categories.map(c => c.category_name));
}
run().finally(() => prisma.$disconnect());
