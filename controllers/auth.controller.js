import AuthService from "../services/auth.service.js";
import OTPController from "./otp.controller.js";
class AuthController {
    async register(req, res) {
        try {
            const { name, email, password, app_id, role } = req.body; // Add role here
            console.log('🎯 Controller received role:', role); // Debug log

            const result = await AuthService.register(name, email, password, app_id, role);
            res.status(result.success ? 201 : 400).json(result);
        } catch (error) {
            console.error("Register error:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

    async login(req, res) {
        try {
            const { email, password, app_id } = req.body; // ← Added app_id
            const result = await AuthService.login(email, password, app_id);
            res.status(result.success ? 200 : 401).json(result);
        } catch (error) {
            console.error("Login controller error:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

    async validateToken(req, res) {
        try {
            const { token } = req.body;
            const result = await AuthService.validateToken(token);
            res.status(result.success ? 200 : 401).json(result);
        } catch (error) {
            console.error("Token validation controller error:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

    async refreshTokenController(req, res) {
        try {
            const { refreshToken } = req.body;
            const result = await AuthService.refreshToken(refreshToken);
            return res.status(result.success ? 200 : 401).json(result);
        } catch (err) {
            console.error("Error in refreshTokenController:", err);
            return res.status(500).json({ success: false, message: "Server error" });
        }
    }

    async getCurrentUserController(req, res) {
        try {
            const authHeader = req.headers.authorization;
            const token = authHeader?.split(" ")[1];
            const result = await AuthService.getCurrentUser(token);
            return res.status(result.success ? 200 : 401).json(result);
        } catch (err) {
            console.error("Error in getCurrentUserController:", err);
            return res.status(500).json({ success: false, message: "Server error" });
        }
    }

    async logoutController(req, res) {
        try {
            const { refreshToken } = req.body;
            const result = await AuthService.logout(refreshToken);
            return res.status(result.success ? 200 : 400).json(result);
        } catch (err) {
            console.error("Error in logoutController:", err);
            return res.status(500).json({ success: false, message: "Server error" });
        }
    }
    
    async sendVerificationEmail(req, res) {
        try {
            const { email } = req.body;
            const result = await OTPController.sendVerificationEmail(email);
            res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
            console.error("Send verification email error:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

    async verifyEmail(req, res) {
        try {
            const { email, otp } = req.body;
            const result = await OTPController.verifyEmail(email, otp);
            res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
            console.error("Verify email error:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

    async resendOTP(req, res) {
        try {
            const { email } = req.body;
            const result = await OTPController.resendOTP(email);
            res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
            console.error("Resend OTP error:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

}

export default new AuthController();