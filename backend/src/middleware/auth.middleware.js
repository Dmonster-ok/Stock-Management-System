const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

// Verify JWT token middleware
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized! Invalid token' });
  }
};

// Check if user is admin
exports.isAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Require Admin Role!' });
  }
  next();
};

// Check if user is manager or admin
exports.isManagerOrAdmin = (req, res, next) => {
  if (req.userRole !== 'manager' && req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Require Manager or Admin Role!' });
  }
  next();
};