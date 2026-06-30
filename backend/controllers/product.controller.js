const productService = require("../services/product.service");

class ProductController {
  async create(req, res) {
    try {
      const product = await productService.createProduct(req.body);
      res.status(201).json({
        success: true,
        message: "Tạo sản phẩm thành công",
        data: product,
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getAll(req, res) {
    try {
      const result = await productService.getProducts(req.query);
      res.status(200).json({
        success: true,
        data: result.products,
        pagination: result.pagination,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const product = await productService.updateProduct(id, req.body);
      res
        .status(200)
        .json({ success: true, message: "Cập nhật thành công", data: product });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      await productService.deleteProduct(id);
      res
        .status(200)
        .json({ success: true, message: "Xóa sản phẩm thành công" });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Controller riêng để bắt file ảnh từ Cloudinary
  async uploadImage(req, res) {
    try {
      const { id } = req.params;
      const { isPrimary } = req.body;

      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "Vui lòng chọn một ảnh hợp lệ!" });
      }

      // URL được Cloudinary trả về nằm ở req.file.path
      const imageUrl = req.file.path;

      // isPrimary từ FormData gửi lên thường là dạng String ('true' / 'false')
      const isPrimaryBool = isPrimary === "true";

      const newImage = await productService.addProductImage(
        id,
        imageUrl,
        isPrimaryBool,
      );

      res.status(201).json({
        success: true,
        message: "Tải ảnh lên thành công",
        data: newImage,
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async deleteImage(req, res) {
    try {
      const { id, imageId } = req.params;
      await productService.deleteProductImage(id, imageId);
      res.status(200).json({ success: true, message: "Xóa ảnh thành công" });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const product = await productService.getProductById(id);
      res.status(200).json({ success: true, data: product });
    } catch (error) {
      res.status(404).json({ success: false, message: error.message });
    }
  }
}

module.exports = new ProductController();
