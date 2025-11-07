import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

class UserService {
  async getAllUsers(app_id, page = 1, limit = 10, search = '') {
    try {
      // Validate pagination parameters
      page = Math.max(1, parseInt(page));
      limit = Math.min(Math.max(1, parseInt(limit)), 100); // Max 100 per page
      const skip = (page - 1) * limit;

      // Build where clause
      const where = { app_id };
      
      // Add search filter if provided
      if (search && search.trim() !== '') {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Get users with pagination
      const [users, totalUsers] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            app_id: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.user.count({ where })
      ]);

      const totalPages = Math.ceil(totalUsers / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return { 
        success: true, 
        message: "Users retrieved successfully", 
        data: {
          users,
          pagination: {
            currentPage: page,
            totalPages,
            totalUsers,
            usersPerPage: limit,
            hasNextPage,
            hasPrevPage,
            nextPage: hasNextPage ? page + 1 : null,
            prevPage: hasPrevPage ? page - 1 : null
          }
        }
      };
    } catch (error) {
      console.error("Get users error:", error);
      return { success: false, message: "Internal server error" };
    }
  }

  // Keep the existing deleteUser method
  async deleteUser(userId, adminAppId) {
    try {
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, app_id: true, email: true }
      });

      if (!targetUser) {
        return { success: false, message: "User not found" };
      }

      if (targetUser.app_id !== adminAppId) {
        return { 
          success: false, 
          message: "Cannot delete user from different app" 
        };
      }

      await prisma.user.delete({
        where: { id: userId }
      });

      return { 
        success: true, 
        message: "User deleted successfully",
        deletedUser: { id: userId, email: targetUser.email }
      };
    } catch (error) {
      console.error("Delete user error:", error);
      
      if (error.code === 'P2025') {
        return { success: false, message: "User not found" };
      }
      
      return { success: false, message: "Internal server error" };
    }
  }
}

export default new UserService();