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
  async safeDelete(req, res) {
    try {
      const DeletePro = await productService.safeDelete(req.params.id);
      res.status(200).json({
        success: true,
        message: "Xóa sản phẩm thành công",
        data: DeletePro,
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
  async getProductsImages(req, res) {
    try {
      const getProducts = await productService.getProductsWithImages();
      res.status(200).json({
        success: true,
        data: getProducts,
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
  async getProductContaint(req, res) {
    try {
      const getProducts = req.body.product_name; // Lấy từ body
      const getProductContain =
        await productService.getProductContain(getProducts);
      res.status(200).json({
        success: true,
        data: getProductContain,
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
  async filterPro(req, res) {
    try {
      const filterPro = await productService.filterProducts();
      res.status(200).json({
        success: true,
        data: filterPro,
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
  async getALlp(req, res) {
    try {
      const pro = await productService.getAllP1();
      res.status(200).json({
        success: true,
        data: pro,
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
  async getALlp2(req, res) {
    try {
      const pro = await productService.getAllP2();
      res.status(200).json({
        success: true,
        data: pro,
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
  async updateProCus(req, res) {
    try {
      const getId = req.params.id;
      const getData = req.body;
      getData.id = getId; // Cập nhật thời gian sửa đổi
      const updatePro = await productService.updateProductCustom(getData);
      res.status(200).json({
        success: true,
        message: "Cập nhật sản phẩm thành công",
        data: updatePro,
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
  async proCus(req, res) {
    // req -> dữ liệu gửi, res => dữ liệu trả
    try {
      // 1. Chỉ thò tay vào đúng 1 cái túi tên là req.query
      const filterData = req.query;

      // 2. Truyền nguyên cục filterData đó xuống Service
      const result = await productService.readProCus(filterData);

      // 3. Trả kết quả về
      res.status(200).json({
        success: true,
        message: "Lấy dữ liệu thành công",
        data: result,
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
  // req.params.id => localhost:5000/api/products/quy/:03555 => 03555
  // params => localhost:5000/api/products/quy/:03555 =>
  // req.body
  // req.querry => localhost:5000/api/products/search?product_name=abc&category=xyz
  async getPro(req, res) {
    try {
      const getPro = await productService.getProductandCate();
      res.status(200).json({
        success: true,
        data: getPro,
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
  async createProcus(req, res) {
    try {
      const data = req.body;
      const create = await productService.createPro1(data);
      res.status(201).json({
        success: true,
        message: "Tạo sản phẩm thành công",
        data: create,
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
  async updatePro(req, res) {
    try {
      const id = req.params.id;
      const data = req.body;
      const create = await productService.createPro1(id,data);
      res.status(201).json({
        success: true,
        message: "Tạo sản phẩm thành công",
        data: create,
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = new ProductController();
