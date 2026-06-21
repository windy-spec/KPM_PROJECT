const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const sessions = await prisma.ai_chat_sessions.findMany({
      where: { user_id: { not: null } },
      select: { id: true, user_id: true }
    });
    console.log("Sessions count:", sessions.length);
    if (sessions.length > 0) {
      console.log("Sample user_id:", sessions[0].user_id);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
test();
