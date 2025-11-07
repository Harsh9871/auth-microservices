import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { generateToken, verifyToken } from "../utils/jwt.util.js";
import { hashPassword, comparePassword } from "../utils/hash.util.js";

dotenv.config();
const prisma = new PrismaClient();

class AuthService {
  async register(name, email, password, app_id) {
    try {
      if (!name || !email || !password || !app_id)
        return { success: false, message: "All fields are required" };

      // ✅ Input validation
      if (typeof name !== 'string' || name.trim().length < 2)
        return { success: false, message: "Name must be at least 2 characters" };

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email))
        return { success: false, message: "Invalid email format" };

      if (password.length < 6)
        return { success: false, message: "Password must be at least 6 characters long" };

      // ✅ Check app existence
      const app = await prisma.app.findUnique({ where: { app_id } });
      if (!app) return { success: false, message: "App not found" };

      // ✅ Check if email already exists in same app (using composite unique)
      const existingUser = await prisma.user.findUnique({
        where: { email_app_id: { email, app_id } }
      });
      if (existingUser)
        return { success: false, message: "Email already registered in this app" };

      // ✅ Hash password
      const hashedPassword = await hashPassword(password);

      // ✅ Create user
      const user = await prisma.user.create({
        data: { 
          name: name.trim(), 
          email: email.toLowerCase().trim(), 
          password: hashedPassword, 
          app_id 
        },
        select: { 
          id: true, 
          name: true, 
          email: true, 
          app_id: true, 
          role: true,
          createdAt: true 
        },
      });

      return { success: true, message: "User registered successfully", user };
    } catch (error) {
      console.error("Register service error:", error);
      return { success: false, message: "Internal server error" };
    }
  }

  async login(email, password, app_id) {
    try {
      if (!email || !password || !app_id)
        return { success: false, message: "Email, password and app_id are required" };

      // ✅ Find user with app context
      const user = await prisma.user.findUnique({ 
        where: { 
          email_app_id: { 
            email: email.toLowerCase().trim(), 
            app_id 
          } 
        } 
      });
      
      if (!user) return { success: false, message: "Invalid credentials" };

      // ✅ Compare password
      const isMatch = await comparePassword(password, user.password);
      if (!isMatch) return { success: false, message: "Invalid credentials" };

      // ✅ Generate JWT with role
      const accessToken = generateToken(
        { 
          id: user.id, 
          email: user.email, 
          app_id: user.app_id, 
          role: user.role 
        },
        "1h"
      );

      // ✅ Generate refresh token
      const refreshToken = generateToken({ id: user.id }, "7d");
      
      // ✅ Store refresh token in database
      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          userId: user.id
        }
      });

      return { 
        success: true, 
        message: "Login successful", 
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          app_id: user.app_id,
          role: user.role
        }
      };
    } catch (error) {
      console.error("Login service error:", error);
      return { success: false, message: "Internal server error" };
    }
  }

  async validateToken(token) {
    try {
      if (!token) return { success: false, message: "Token is required" };

      const decoded = verifyToken(token);

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, name: true, email: true, app_id: true, role: true },
      });

      if (!user) return { success: false, message: "Invalid token" };

      return { 
        success: true, 
        message: "Token is valid", 
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          app_id: user.app_id,
          role: user.role
        }
      };
    } catch (error) {
      return { success: false, message: "Invalid or expired token" };
    }
  }

  async getCurrentUser(token) {
    try {
      if (!token)
        return { success: false, message: "Token required" };
    
      const decoded = verifyToken(token);
  
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          name: true,
          email: true,
          app_id: true,
          role: true,
          createdAt: true,
        },
      });
  
      if (!user)
        return { success: false, message: "User not found" };
  
      return { success: true, user };
    } catch (err) {
      return { success: false, message: "Invalid or expired token" };
    }
  }
  
  async refreshToken(oldRefreshToken) {
    try {
      if (!oldRefreshToken)
        return { success: false, message: "Refresh token required" };
  
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: oldRefreshToken },
        include: { user: true },
      });
  
      if (!storedToken)
        return { success: false, message: "Invalid refresh token" };
  
      if (new Date(storedToken.expiresAt) < new Date()) {
        // Delete expired token
        await prisma.refreshToken.delete({ where: { token: oldRefreshToken } });
        return { success: false, message: "Refresh token expired" };
      }
  
      const user = storedToken.user;
      const newAccessToken = generateToken(
        { 
          id: user.id, 
          email: user.email, 
          app_id: user.app_id, 
          role: user.role 
        },
        "1h"
      );
  
      return {
        success: true,
        message: "Token refreshed successfully",
        accessToken: newAccessToken,
      };
    } catch (error) {
      console.error("Refresh token service error:", error);
      return { success: false, message: "Internal server error" };
    }
  }

  async logout(refreshToken) {
    try {
      if (!refreshToken)
        return { success: false, message: "Refresh token required" };

      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken }
      });

      return { success: true, message: "Logged out successfully" };
    } catch (error) {
      console.error("Logout service error:", error);
      return { success: false, message: "Internal server error" };
    }
  }
}

export default new AuthService();