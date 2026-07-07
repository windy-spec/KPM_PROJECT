const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const embedder = require('../utils/embedder.util');

async function main() {
  console.log('Fetching records without embedding_vector...');
  
  // Find all records where embedding_vector is null. 
  // Since Prisma doesn't fully support querying Unsupported fields directly for NULL easily in Prisma Client 
  // we can use raw query to fetch IDs.
  const records = await prisma.$queryRaw`SELECT id, rule_title, rule_content FROM ai_knowledge_base WHERE embedding_vector IS NULL`;

  console.log(`Found ${records.length} records needing embedding vectors.`);

  if (records.length === 0) {
    console.log('All records already have embedding vectors.');
    return;
  }

  let updatedCount = 0;
  for (const record of records) {
    const textToEmbed = `${record.rule_title}\n${record.rule_content}`;
    console.log(`Generating vector for: ${record.rule_title}`);
    
    const vector = await embedder.getVector(textToEmbed);
    const vectorString = `[${vector.join(",")}]`;

    await prisma.$executeRaw`UPDATE ai_knowledge_base SET embedding_vector = ${vectorString}::vector WHERE id = ${record.id}::uuid`;
    
    updatedCount++;
  }

  console.log(`Successfully generated and updated embedding vectors for ${updatedCount} records.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
