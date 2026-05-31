const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_token_for_attendance_system_2026';

// Verify token middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expects 'Bearer TOKEN'

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access Denied. Authorization token required.' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified; // verified payload typically: { id, username, role }
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
};

// Role-Based Access Control (RBAC) middleware
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Authenticated user required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. Requires one of the following roles: [${roles.join(', ')}]` 
      });
    }

    next();
  };
};

module.exports = {
  verifyToken,
  authorizeRoles
};
