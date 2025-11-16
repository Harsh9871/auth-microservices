import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

class OTPService {
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async createOTPVerification(userId, email) {
    try {
      const otp = this.generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Delete any existing OTP for this user
      await prisma.emailVerification.deleteMany({
        where: { userId }
      });

      // Create new OTP
      const verification = await prisma.emailVerification.create({
        data: {
          userId,
          email,
          otp,
          expiresAt,
          attempts: 0
        }
      });

      return { success: true, otp, verification };
    } catch (error) {
      console.error('Error creating OTP:', error);
      return { success: false, message: 'Failed to create OTP' };
    }
  }

  async verifyOTP(userId, otp) {
    try {
      const verification = await prisma.emailVerification.findFirst({
        where: { 
          userId,
          otp 
        }
      });

      if (!verification) {
        return { success: false, message: 'Invalid OTP' };
      }

      if (verification.expiresAt < new Date()) {
        await prisma.emailVerification.delete({ where: { id: verification.id } });
        return { success: false, message: 'OTP has expired' };
      }

      if (verification.attempts >= 5) {
        await prisma.emailVerification.delete({ where: { id: verification.id } });
        return { success: false, message: 'Too many attempts. Please request a new OTP' };
      }

      // Increment attempts
      await prisma.emailVerification.update({
        where: { id: verification.id },
        data: { attempts: { increment: 1 } }
      });

      // Mark user as verified
      await prisma.user.update({
        where: { id: userId },
        data: { isVerified: true }
      });

      // Delete used OTP
      await prisma.emailVerification.delete({ where: { id: verification.id } });

      return { success: true, message: 'Email verified successfully' };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return { success: false, message: 'Failed to verify OTP' };
    }
  }

  async resendOTP(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, isVerified: true }
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      if (user.isVerified) {
        return { success: false, message: 'Email is already verified' };
      }

      const result = await this.createOTPVerification(user.id, user.email);
      
      if (!result.success) {
        return result;
      }

      return { 
        success: true, 
        message: 'OTP sent successfully',
        otp: result.otp // In production, you might not want to return the OTP
      };
    } catch (error) {
      console.error('Error resending OTP:', error);
      return { success: false, message: 'Failed to resend OTP' };
    }
  }
}

export default new OTPService();