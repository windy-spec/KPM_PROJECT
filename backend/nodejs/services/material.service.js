const prisma = require("../models/prisma");

class MaterialService {
  async getAllMaterials() {
    const materials = await prisma.materials.findMany();
    return materials;
  }
}

module.exports = new MaterialService();
