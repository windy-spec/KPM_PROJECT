const prisma = require("../models/prisma");
const Groq = require("groq-sdk");
require("dotenv").config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// Danh sách hashtag cố định
const ALLOWED_HASHTAGS = [
    "#NoiThat", "#ThietKe", "#XuHuong", "#KienThuc", 
    "#BaoGia", "#DuAn", "#SanXuat", "#GocChiaSe"
];
class ForumService {
  async generateForumPost(requestedTags = []) {
    try {
      // Lấy tổng số sản phẩm
      const count = await prisma.products.count();
      if (count === 0) return { success: false, message: "Không có sản phẩm nào trong DB" };

      // Lấy 1-3 sản phẩm ngẫu nhiên
      const productsList = await prisma.products.findMany({
        select: { id: true }
      });
      
      const shuffled = productsList.sort(() => 0.5 - Math.random());
      const selectedIds = shuffled.slice(0, Math.floor(Math.random() * 3) + 1).map(p => p.id);

      const products = await prisma.products.findMany({
        where: { id: { in: selectedIds } },
        include: { product_images: true }
      });

      // Tạo chuỗi thông tin sản phẩm để truyền cho Groq
      let productContext = "Thông tin sản phẩm để viết bài:\n\n";
      products.forEach((p, index) => {
        productContext += `Sản phẩm ${index + 1}:\n`;
        productContext += `- Tên: ${p.product_name}\n`;
        productContext += `- Mô tả: ${p.description || "Sản phẩm chất lượng cao"}\n`;
        if (p.product_images && p.product_images.length > 0) {
            productContext += `- Hình ảnh: ${p.product_images.map(img => img.image_url).join(', ')}\n`;
        }
        productContext += `\n`;
      });

      let hashtagInstruction = "";
      if (requestedTags && requestedTags.length > 0) {
        hashtagInstruction = `4. Bạn BẮT BUỘC phải viết bài tập trung chuyên sâu vào các chủ đề liên quan đến hashtag sau: ${requestedTags.join(", ")}. BẮT BUỘC danh sách hashtags trả về phải chính xác là mảng này: ${JSON.stringify(requestedTags)}, không được thêm bớt hashtag nào khác.`;
      } else {
        hashtagInstruction = `4. Chọn 2 đến 3 hashtag phù hợp NHẤT từ danh sách BẮT BUỘC sau: ${ALLOWED_HASHTAGS.join(", ")}. Không được tạo hashtag mới.`;
      }

      const prompt = `
Bạn là một chuyên gia marketing cho một công ty sản xuất cơ khí và nội thất thép. Hãy viết một bài đăng trên diễn đàn giới thiệu các sản phẩm sau đây:

${productContext}

Yêu cầu bắt buộc:
1. Đặt một tiêu đề thật hấp dẫn.
2. Viết nội dung bài viết bằng tiếng Việt, giọng văn tự nhiên, thân thiện và chuyên nghiệp. Dùng định dạng Markdown.
3. CHÈN TRỰC TIẾP các URL hình ảnh vào trong bài viết dưới dạng Markdown ảnh (VD: ![Tên ảnh](URL_ảnh) ) để minh hoạ sống động.
${hashtagInstruction}
5. CẤM NGẶT NGHÈO: TUYỆT ĐỐI KHÔNG SỬ DỤNG các từ khóa liên quan đến 'Khuyến mãi', 'Giảm giá', 'Sale', hoặc đưa ra bất kỳ 'Cam kết giá' nào. Khi nhắc đến giá cả, chỉ được dùng từ 'Báo giá' hoặc 'Ước chừng giá'.

Trả về định dạng JSON theo đúng schema sau (không trả về markdown block, chỉ text JSON hợp lệ):
{
  "title": "Tiêu đề bài viết",
  "content": "Nội dung bài viết chứa markdown ảnh",
  "hashtags": ["#Hashtag1", "#Hashtag2"]
}
`;

      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "qwen-3.6-27b",
        response_format: { type: "json_object" }
      });

      const contentResponse = chatCompletion.choices[0]?.message?.content;
      const parsedData = JSON.parse(contentResponse);

      // Lưu vào database
      const newPost = await prisma.forum_posts.create({
        data: {
          title: parsedData.title,
          content: parsedData.content,
          hashtags: parsedData.hashtags || [],
          status: "pending",
          related_product_ids: selectedIds
        }
      });

      return { success: true, post: newPost };
    } catch (error) {
      console.error("Lỗi khi generateForumPost:", error);
      return { success: false, error: error.message };
    }
  }

  // Admin: Lấy danh sách (Có tìm kiếm, lọc)
  async getAdminPosts(filters = {}) {
    const { search, hashtag, status, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    let whereClause = {};
    if (search) {
      whereClause.title = { contains: search, mode: "insensitive" };
    }
    if (status) {
      whereClause.status = status;
    }
    if (hashtag) {
      whereClause.hashtags = { array_contains: hashtag }; 
    }

    const [posts, total] = await Promise.all([
      prisma.forum_posts.findMany({
        where: whereClause,
        orderBy: { created_at: "desc" },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.forum_posts.count({ where: whereClause })
    ]);

    return { posts, total, page: parseInt(page), limit: parseInt(limit) };
  }

  // User: Lấy danh sách (Chỉ lấy published)
  async getPublicPosts(filters = {}) {
    const { search, hashtag, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    let whereClause = { status: "published" };
    if (search) {
      whereClause.title = { contains: search, mode: "insensitive" };
    }
    if (hashtag) {
       whereClause.hashtags = { array_contains: hashtag };
    }

    const [posts, total] = await Promise.all([
      prisma.forum_posts.findMany({
        where: whereClause,
        orderBy: { created_at: "desc" },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.forum_posts.count({ where: whereClause })
    ]);

    return { posts, total, page: parseInt(page), limit: parseInt(limit) };
  }

  async getPostById(id) {
    return await prisma.forum_posts.findUnique({
      where: { id }
    });
  }

  async updatePost(id, updateData) {
    return await prisma.forum_posts.update({
      where: { id },
      data: updateData
    });
  }
}

module.exports = new ForumService();
