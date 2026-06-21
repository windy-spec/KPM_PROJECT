const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const embedder = require("../utils/embedder.util");

const prisma = new PrismaClient();

async function seedKnowledgeBase() {
  console.log("🚀 Bắt đầu seed dữ liệu vào Knowledge Base...");

  const filePath = path.join(__dirname, "../data/knowledge.json");
  const rawData = fs.readFileSync(filePath, "utf-8");
  const knowLedgeList = JSON.parse(rawData);

  for (const item of knowLedgeList) {
    console.log(`\nĐang xử lý: "${item.question}"`);
    const vectorArray = await embedder.getVector(item.rule_content);
    const vectorString = `[${vectorArray.join(",")}]`;
    try {
      await prisma.$executeRaw`
            INSERT INTO ai_knowledge_base(id,rule_title,rule_content,embedding_vector)
            VALUES(
            gen_random_uuid(),
            ${item.rule_title},
            ${item.rule_content},
            ${vectorString}::vector)`;
      console.log(`✅ Đã lưu vào cơ sở dữ liệu`);
    } catch (error) {
      console.error(`❌ Lỗi khi lưu vào cơ sở dữ liệu: ${error.message}`);
    }
  }
  console.log("\n🎉 HOÀN TẤT NẠP DỮ LIỆU! AI ĐÃ SẴN SÀNG.");
  await prisma.$disconnect();
}
seedKnowledgeBase();
