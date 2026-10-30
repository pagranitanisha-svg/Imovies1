const bcrypt = require('bcrypt');
const { body } = require('express-validator');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/generateToken');

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const normalizedEmail = email.trim().toLowerCase();
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
  });

  res.status(201).json({
    success: true,
    token: generateToken(user),
    user: publicUser(user),
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
  const credentialsAreValid = user && await bcrypt.compare(password, user.password);

  if (!credentialsAreValid) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  res.status(200).json({
    success: true,
    token: generateToken(user),
    user: publicUser(user),
  });
});

const getCurrentUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    user: publicUser(req.user),
  });
});

const registrationValidation = [
  body('name').isString().trim().isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Enter a valid email address'),
  body('password')
    .isString()
    .isLength({ min: 8, max: 128 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    .withMessage('Password must be at least 8 characters and include uppercase, lowercase, and numeric characters'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Enter a valid email address'),
  body('password').isString().notEmpty().withMessage('Password is required'),
];

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  registrationValidation,
  loginValidation,
};
