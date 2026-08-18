class EmbedderService {
  constructor() {
    this.extractor = null;
    this.pipeline = null;
  }

  async init() {
    if (!this.pipeline) {
      const transformers = await import("@xenova/transformers");
      this.pipeline = transformers.pipeline;
    }

    if (!this.extractor) {
      this.extractor = await this.pipeline(
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
