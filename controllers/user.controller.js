import UserService from "../services/user.service.js";

class UserController {
  async getAllUsers(req, res) {
    try {
      const app_id = req.userAppId;
      const { 
        page = 1, 
        limit = 10, 
        search = '' 
      } = req.query;

      const result = await UserService.getAllUsers(app_id, page, limit, search);
      
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      console.error("Get all users controller error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }

  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const adminAppId = req.userAppId;
      const adminUserId = req.user.id;
      
      if (id === adminUserId) {
        return res.status(400).json({ 
          success: false, 
          message: "Cannot delete your own account" 
        });
      }

      const result = await UserService.deleteUser(id, adminAppId);
      
      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      console.error("Delete user controller error:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  }
}

export default new UserController();