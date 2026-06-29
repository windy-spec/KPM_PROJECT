const express = require("express");
const favoriteController = require("../controllers/favorite.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authMiddleware); // Tất cả API favorite đều cần đăng nhập

router.post("/toggle", favoriteController.toggleFavorite);
router.get("/", favoriteController.getUserFavorites);
router.get("/check/:productId", favoriteController.checkFavorite);
router.delete("/:id", favoriteController.removeFavorite);

module.exports = router;
