import AuthService from "../services/auth.service.js";

class AuthController {
    async register(req, res) {
        try {
            const { name, email, password, app_id } = req.body;
            const result = await AuthService.register(name, email, password, app_id);
            res.status(result.success ? 201 : 400).json(result);
        } catch (error) {
            console.error("Register error:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;
            const result = await AuthService.login(email, password);
            res.status(result.success ? 200 : 401).json(result);
        } catch (error) {
            console.error("Login error:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    }

    async validateToken(req, res) {
        try {
            const { token } = req.body;
            const result = await AuthService.validateToken(token);
            res.status(result.success ? 200 : 401).json(result);
        } catch (error) {
            console.error("Token validation error:", error);
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
}

export default new AuthController();
