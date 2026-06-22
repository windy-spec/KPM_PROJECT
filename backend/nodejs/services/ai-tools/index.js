const fs = require("fs");
const path = require("path");

const allTools = [];

// 1. Ma thuật Auto-Discovery: Tự động quét tất cả các file .js trong thư mục này
const files = fs.readdirSync(__dirname);

files.forEach((file) => {
  // Bỏ qua chính file index.js này và các file không phải .js
  if (file === "index.js" || !file.endsWith(".js")) return;

  // Import file tool
  const tool = require(path.join(__dirname, file));

  // Kiểm tra xem file tool đó có viết đúng chuẩn không (có definition và execute)
  if (tool.definition && tool.execute) {
    allTools.push(tool);
    console.log(
      `[Tool Registry] Đã nạp thành công tool: ${tool.definition.function.name}`,
    );
  }
});

// 2. Xuất ra cái Vali đồ nghề cho Groq
const toolsDefinition = allTools.map((tool) => tool.definition);

// 3. Cỗ máy điều phối
const executeTool = async (functionName, args, prisma) => {
  const tool = allTools.find(
    (t) => t.definition.function.name === functionName,
  );

  if (!tool) {
    console.warn(`[Tool Registry] AI gọi hàm không tồn tại: ${functionName}`);
    return "Lỗi: Hàm không tồn tại.";
  }

  try {
    return await tool.execute(args, prisma);
  } catch (error) {
    console.error(`[Tool Registry] Lỗi khi chạy tool ${functionName}:`, error);
    return "Hệ thống đang bận, không lấy được dữ liệu lúc này.";
  }
};

module.exports = { toolsDefinition, executeTool };
