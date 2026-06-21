// Đường dẫn: backend/nodejs/scripts/test_embedding.js
const embedder = require("../utils/embedder.util");

// Công thức Toán học so sánh khoảng cách giữa 2 Vector (Cosine Similarity)
function calculateCosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  // Vì lúc tạo vector ta đã bật normalize: true (độ dài = 1),
  // nên mẫu số luôn = 1, chỉ cần tính Tử số (Tích vô hướng) là ra kết quả.
  return dotProduct;
}

async function runTest() {
  console.log("🚀 Bắt đầu test cơ chế Embedding của KPM...\n");

  const text1 = "Inox 304 giá bao nhiêu?";
  const text2 = "Cho tôi xin báo giá dòng Inox 304";
  const text3 = "Cách luộc gà ngon không bị nứt da";

  console.log(`Đang phân tích Câu 1: "${text1}"`);
  const vector1 = await embedder.getVector(text1);
  console.log(
    `=> Chiều dài vector: ${vector1.length} (Đúng chuẩn không gian 384 chiều)`,
  );
  console.log(
    `=> 5 chỉ số đầu tiên: [${vector1
      .slice(0, 5)
      .map((n) => n.toFixed(4))
      .join(", ")}, ...]\n`,
  );

  console.log(`Đang phân tích Câu 2: "${text2}"`);
  const vector2 = await embedder.getVector(text2);

  console.log(`\nĐang phân tích Câu 3: "${text3}"`);
  const vector3 = await embedder.getVector(text3);

  console.log("\n🧪 KẾT QUẢ SO SÁNH NGỮ NGHĨA (COSINE SIMILARITY):");
  const sim1_2 = calculateCosineSimilarity(vector1, vector2);
  const sim1_3 = calculateCosineSimilarity(vector1, vector3);

  console.log(
    `- Độ giống nhau giữa Câu 1 và Câu 2 (Cùng hỏi giá vật tư): ${(sim1_2 * 100).toFixed(2)}%`,
  );
  console.log(
    `- Độ giống nhau giữa Câu 1 và Câu 3 (Lạc đề): ${(sim1_3 * 100).toFixed(2)}%`,
  );
}

runTest();
