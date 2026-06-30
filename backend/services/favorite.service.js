const prisma = require("../models/prisma");

class FavoriteService {
  async addFavorite(userId, productId) {
    // Kiểm tra xem đã tồn tại chưa
    const existing = await prisma.favorite_products.findUnique({
      where: {
        user_id_product_id: {
          user_id: userId,
          product_id: productId,
        },
      },
    });

    if (existing) {
      // Nếu đã có thì xóa (toggle)
      await prisma.favorite_products.delete({
        where: { id: existing.id },
      });
      return { message: "Đã bỏ yêu thích sản phẩm", isFavorite: false };
    }

    // Nếu chưa có thì thêm
    await prisma.favorite_products.create({
      data: {
        user_id: userId,
        product_id: productId,
      },
    });
    return { message: "Đã lưu sản phẩm vào danh sách yêu thích", isFavorite: true };
  }

  async removeFavorite(id, userId) {
    const favorite = await prisma.favorite_products.findUnique({
      where: { id },
    });
    if (!favorite || favorite.user_id !== userId) {
      throw new Error("Không tìm thấy sản phẩm yêu thích");
    }
    await prisma.favorite_products.delete({
      where: { id },
    });
    return { message: "Đã xóa khỏi danh sách yêu thích" };
  }

  async getUserFavorites(userId) {
    return prisma.favorite_products.findMany({
      where: { user_id: userId },
      include: {
        products: {
          include: {
            product_images: true,
            product_categories: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });
  }

  async checkFavorite(userId, productId) {
    const favorite = await prisma.favorite_products.findUnique({
      where: {
        user_id_product_id: {
          user_id: userId,
          product_id: productId,
        },
      },
    });
    return { isFavorite: !!favorite, favoriteId: favorite?.id };
  }
}

module.exports = new FavoriteService();
