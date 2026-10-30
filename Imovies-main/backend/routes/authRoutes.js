const express = require('express');
const {
  getCurrentUser,
  loginUser,
  loginValidation,
  registerUser,
  registrationValidation,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.post('/register', registrationValidation, validateRequest, registerUser);
router.post('/login', loginValidation, validateRequest, loginUser);
router.get('/me', protect, getCurrentUser);

module.exports = router;
