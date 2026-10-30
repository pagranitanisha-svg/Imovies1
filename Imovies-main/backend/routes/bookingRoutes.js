const express = require('express');
const {
  cancelBooking,
  createBooking,
  getAllBookings,
  getBookingById,
  getUserBookings,
  bookingValidation,
} = require('../controllers/bookingController');
const { adminOnly, protect } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.post('/', protect, bookingValidation, validateRequest, createBooking);
router.get('/my-bookings', protect, getUserBookings);
router.get('/', protect, adminOnly, getAllBookings);
router.get('/:id', protect, getBookingById);
router.patch('/:id/cancel', protect, cancelBooking);

module.exports = router;
