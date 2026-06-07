const cartService = require("../services/cart.service");

class CartController {
  async getCart(req, res) {
    try {
      const userId = req.user.id; // Lấy từ authMiddleware
      const cart = await cartService.getCart(userId);
      res.status(200).json({ success: true, data: cart });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }

  async addToCart(req, res) {
    try {
      const userId = req.user.id;
      const item = await cartService.addToCart(userId, req.body);
      res
        .status(201)
        .json({ success: true, message: "Đã thêm vào giỏ hàng!", data: item });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }

  async updateQuantity(req, res) {
    try {
      const userId = req.user.id;
      const itemId = req.params.id;
      const { quantity } = req.body;

      const updatedItem = await cartService.updateQuantity(
        userId,
        itemId,
        quantity,
      );
      res
        .status(200)
        .json({
          success: true,
          message: "Đã cập nhật số lượng",
          data: updatedItem,
        });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }

  async removeItem(req, res) {
    try {
      const userId = req.user.id;
      const itemId = req.params.id;

      await cartService.removeItem(userId, itemId);
      res.status(200).json({ success: true, message: "Đã xóa khỏi giỏ hàng" });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }

  async submitCart(req, res) {
    try {
      const userId = req.user.id;
      const result = await cartService.submitCart(userId);
      res.status(200).json({ success: true, message: result.message });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }
}

module.exports = new CartController();
