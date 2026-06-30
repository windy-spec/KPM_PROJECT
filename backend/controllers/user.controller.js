const userService = require("../services/user.service");

class UserController {
  async getProfileStats(req, res) {
    try {
      const stats = await userService.getProfileStats(req.user.id);
      res.status(200).json({ success: true, data: stats });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }
}

module.exports = new UserController();
