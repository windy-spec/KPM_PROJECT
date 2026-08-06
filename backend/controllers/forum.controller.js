const forumService = require("../services/forum.service");

class ForumController {
  // Trigger gen AI thủ công (cho Admin test)
  async generatePost(req, res) {
    try {
      const { hashtags } = req.body || {};
      const result = await forumService.generateForumPost(hashtags);
      if (!result.success) {
        return res.status(400).json(result);
      }
      res.status(200).json(result);
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  }

  // Admin lấy ds
  async getAdminPosts(req, res) {
    try {
      const filters = req.query; // search, hashtag, status, page, limit
      const data = await forumService.getAdminPosts(filters);
      res.status(200).json({ success: true, ...data });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }

  // User lấy ds
  async getPublicPosts(req, res) {
    try {
      const filters = req.query; // search, hashtag, page, limit
      const data = await forumService.getPublicPosts(filters);
      res.status(200).json({ success: true, ...data });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }

  // Xem chi tiết
  async getPostById(req, res) {
    try {
      const post = await forumService.getPostById(req.params.id);
      if (!post) {
        return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
      }
      res.status(200).json({ success: true, data: post });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }

  // Cập nhật trạng thái / chỉnh sửa (Admin duyệt)
  async updatePost(req, res) {
    try {
      const updateData = req.body;
      const updatedPost = await forumService.updatePost(req.params.id, updateData);
      res.status(200).json({ success: true, data: updatedPost });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }
}

module.exports = new ForumController();
