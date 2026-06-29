const { pipeline } = require("@xenova/transformers");

class EmbedderService {
  constructor() {
    this.extractor = null;
  }

  async init() {
    if (!this.extractor) {
      this.extractor = await pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2",
        { quantized: true },
      );
    }
  }

  async getVector(text) {
    await this.init();

    const output = await this.extractor(text, {
      pooling: "mean",
      normalize: true,
    });
    return Array.from(output.data);
  }
}

module.exports = new EmbedderService();
