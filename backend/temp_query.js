const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function main() {
    const order = await prisma.orders.findUnique({ where: { id: 'e536c564-2509-4774-b994-9122431b3e1a' } });
    let out = 'ORDER REQS:\n' + JSON.stringify(order.material_requirements, null, 2) + '\n\n';

    const inv = await prisma.inventory.findMany({
        select: {
            material_id: true,
            thickness_id: true,
            quantity: true,
            materials: { select: { material_name: true } }
        }
    });
    out += 'INVENTORY:\n' + JSON.stringify(inv, null, 2) + '\n';
    fs.writeFileSync('temp_out.txt', out, 'utf8');
}

main().finally(() => prisma.$disconnect());
