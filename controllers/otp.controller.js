import OTPService from "../services/otp.service.js";
import EmailService from "../services/email.service.js";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

class OTPController {
  async sendVerificationEmail(email) {
    try {
      const user = await prisma.user.findFirst({
        where: { email },
        select: { id: true, name: true, email: true, isVerified: true }
      });

      if (!user) {
        return { success: false, message: "User not found" };
      }

      if (user.isVerified) {
        return { success: false, message: "Email is already verified" };
      }

      const otpResult = await OTPService.createOTPVerification(user.id, user.email);
      
      if (!otpResult.success) {
        return otpResult;
      }

      const emailSent = await EmailService.sendOTP(user.email, otpResult.otp, user.name);

      if (!emailSent) {
        return { success: false, message: "Failed to send verification email" };
      }

      return { 
        success: true, 
        message: "Verification email sent successfully" 
      };
    } catch (error) {
      console.error("Send verification email error:", error);
      return { success: false, message: "Internal server error" };
    }
  }

  async verifyEmail(email, otp) {
    try {
      const user = await prisma.user.findFirst({
        where: { email },
        select: { id: true, isVerified: true }
      });

      if (!user) {
        return { success: false, message: "User not found" };
      }

      if (user.isVerified) {
        return { success: false, message: "Email is already verified" };
      }

      const result = await OTPService.verifyOTP(user.id, otp);
      return result;
    } catch (error) {
      console.error("Verify email error:", error);
      return { success: false, message: "Internal server error" };
    }
  }

  async resendOTP(email) {
    try {
      const user = await prisma.user.findFirst({
        where: { email },
        select: { id: true, name: true, email: true, isVerified: true }
      });

      if (!user) {
        return { success: false, message: "User not found" };
      }

      if (user.isVerified) {
        return { success: false, message: "Email is already verified" };
      }

      const result = await OTPService.resendOTP(user.id);
      
      if (!result.success) {
        return result;
      }

      const emailSent = await EmailService.sendOTP(user.email, result.otp, user.name);

      if (!emailSent) {
        return { success: false, message: "Failed to resend OTP" };
      }

      return { 
        success: true, 
        message: "OTP resent successfully" 
      };
    } catch (error) {
      console.error("Resend OTP error:", error);
      return { success: false, message: "Internal server error" };
    }
  }
}

export default new OTPController();