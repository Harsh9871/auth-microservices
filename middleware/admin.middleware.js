import { verifyToken } from '../utils/jwt.util.js';

export const adminOnly = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: "Access token required" 
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Check if user is admin
    if (decoded.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: "Admin access required" 
      });
    }

    // Attach user info to request
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: "Invalid or expired token" 
    });
  }
};

export const sameAppOnly = (req, res, next) => {
  try {
    const userAppId = req.user.app_id;
    
    // For GET /api/users - no additional check needed, will filter by app_id
    // For DELETE /api/users/:id - check if target user belongs to same app
    if (req.params.id) {
      // This will be checked in the service layer
      req.targetUserId = req.params.id;
    }
    
    req.userAppId = userAppId;
    next();
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};