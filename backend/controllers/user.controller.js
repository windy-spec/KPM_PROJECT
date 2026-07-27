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
  async getAllUsersWarehouse(req, res) {
    try {
      const users = await userService.getAllUserWarehouse();
      res.status(200).json({ success: true, data: users });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
  async getTop3Users(req, res) {
    try {
      const top3Users = await userService.getTop3Users();
      res.status(200).json({
        success: true,
        data: top3Users,
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = new UserController();
