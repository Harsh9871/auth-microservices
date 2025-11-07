import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { generateToken, verifyToken } from "../utils/jwt.util.js";
import { hashPassword, comparePassword } from "../utils/hash.util.js";

dotenv.config();
const prisma = new PrismaClient();

class AuthService {
  async register(name, email, password, app_id) {
    if (!name || !email || !password || !app_id)
      return { success: false, message: "All fields are required" };

    // ✅ email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return { success: false, message: "Invalid email format" };

    if (password.length < 6)
      return { success: false, message: "Password must be at least 6 characters long" };

    // ✅ Check app existence
    const app = await prisma.app.findUnique({ where: { app_id } });
    if (!app) return { success: false, message: "App not found" };

    // ✅ Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return { success: false, message: "Email already registered" };

    // ✅ Hash password using util
    const hashedPassword = await hashPassword(password);

    // ✅ Create user
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, app_id },
      select: { id: true, name: true, email: true, app_id: true, createdAt: true },
    });

    return { success: true, message: "User registered successfully", user };
  }

  async login(email, password) {
    if (!email || !password)
      return { success: false, message: "Email and password are required" };

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { success: false, message: "User not found" };

    // ✅ Compare password using util
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) return { success: false, message: "Invalid credentials" };

    // ✅ Generate JWT using util
    const token = generateToken(
      { id: user.id, email: user.email, app_id: user.app_id },
      "1h"
    );

    return { success: true, message: "Login successful", token };
  }

  async validateToken(token) {
    if (!token) return { success: false, message: "Token is required" };

    try {
      const decoded = verifyToken(token);

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, name: true, email: true, app_id: true },
      });

      if (!user) return { success: false, message: "Invalid token" };

      return { success: true, message: "Token is valid", user };
    } catch (error) {
      return { success: false, message: "Invalid or expired token" };
    }
  }

  async getCurrentUser(token) {
    if (!token)
      return { success: false, message: "Token required" };
  
    try {
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
    if (!oldRefreshToken)
      return { success: false, message: "Refresh token required" };
  
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: oldRefreshToken },
      include: { user: true },
    });
  
    if (!storedToken)
      return { success: false, message: "Invalid refresh token" };
  
    if (new Date(storedToken.expiresAt) < new Date())
      return { success: false, message: "Refresh token expired" };
  
    const user = storedToken.user;
    const newAccessToken = generateToken(
      { id: user.id, email: user.email, app_id: user.app_id },
      "1h"
    );
  
    return {
      success: true,
      message: "Token refreshed successfully",
      token: newAccessToken,
    };
  }
}

export default new AuthService();
