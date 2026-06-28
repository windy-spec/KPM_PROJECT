const searchProduct = require("./searchProduct");
const searchMaterial = require("./searchMaterial");
const searchLabor = require("./searchLabor");
const trackOrder = require("./trackOrder");
const getPastOrder = require("./getPastOrder");

const tools = [searchProduct, searchMaterial, searchLabor, trackOrder, getPastOrder];

const toolsDefinition = tools.map((t) => t.definition);

const executeTool = async (functionName, args, prisma, userId = null) => {
  const tool = tools.find((t) => t.definition.function.name === functionName);
  if (tool) {
    // Ép cứng user_id thật vào args để tránh AI hallucinate UUID. 
    // Nếu chưa đăng nhập thì ép bằng null, đè lên chuỗi vớ vẩn AI tự bịa.
    if (tool.definition.function.parameters.properties.user_id) {
      args.user_id = userId;
    }
    return await tool.execute(args, prisma);
  }
  throw new Error(`Tool ${functionName} not found`);
};

module.exports = {
  toolsDefinition,
  executeTool,
};
