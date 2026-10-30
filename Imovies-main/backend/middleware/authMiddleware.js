const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

const protect = asyncHandler(async (req, res, next) => {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : null;
  if (!token) {
    res.status(401);
    throw new Error('Authentication token required');
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500);
    throw new Error('Authentication is not configured');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, secret);
  } catch (error) {
    res.status(401);
    throw new Error('Authentication token is invalid or expired');
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    res.status(401);
    throw new Error('Authentication token is no longer valid');
  }
  req.user = user;

  next();
});

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Access denied. Admin privileges required');
  }

  next();
};

module.exports = { protect, adminOnly };
