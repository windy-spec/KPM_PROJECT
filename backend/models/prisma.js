const { PrismaClient } = require("@prisma/client");

// Khởi tạo Prisma Client với log cần thiết
const prisma = new PrismaClient({
  log: ["error"],
});

module.exports = prisma;

