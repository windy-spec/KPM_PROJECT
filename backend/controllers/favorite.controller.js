const favoriteService = require("../services/favorite.service");

class FavoriteController {
  async toggleFavorite(req, res) {
    try {
      const userId = req.user.id;
      const { product_id } = req.body;
      if (!product_id) return res.status(400).json({ message: "Thiếu product_id" });

      const result = await favoriteService.addFavorite(userId, product_id);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async removeFavorite(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const result = await favoriteService.removeFavorite(id, userId);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async getUserFavorites(req, res) {
    try {
      const userId = req.user.id;
      const result = await favoriteService.getUserFavorites(userId);
      res.status(200).json({ data: result });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async checkFavorite(req, res) {
    try {
      const userId = req.user.id;
      const { productId } = req.params;
      const result = await favoriteService.checkFavorite(userId, productId);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = new FavoriteController();
