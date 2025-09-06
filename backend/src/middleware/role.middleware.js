const User = require('../models/user.model');

// Middleware to check if user has required roles
const checkRoles = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({ message: 'User role not found' });
    }

    if (!requiredRoles.includes(req.userRole)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${requiredRoles.join(', ')}` 
      });
    }

    next();
  };
};

module.exports = checkRoles;
