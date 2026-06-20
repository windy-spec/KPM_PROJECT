const prisma = require("../models/prisma");

async function updateRoles() {
  console.log("Đang cập nhật description cho các roles...");
  await prisma.roles.upsert({
    where: { role_name: 'admin' },
    update: { description: 'Quản trị viên toàn quyền hệ thống' },
    create: { role_name: 'admin', description: 'Quản trị viên toàn quyền hệ thống' }
  });
  
  await prisma.roles.upsert({
    where: { role_name: 'user' },
    update: { description: 'Khách hàng' },
    create: { role_name: 'user', description: 'Khách hàng' }
  });

  await prisma.roles.upsert({
    where: { role_name: 'admin_kho' },
    update: { description: 'Thủ kho / Quản lý kho vật tư' },
    create: { role_name: 'admin_kho', description: 'Thủ kho / Quản lý kho vật tư' }
  });
  
  console.log("Cập nhật thành công!");
}

updateRoles()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
