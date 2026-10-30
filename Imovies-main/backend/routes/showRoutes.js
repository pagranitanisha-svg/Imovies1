const express = require('express');
const {
  createShow,
  deleteShow,
  getAllShows,
  getAvailableSeats,
  getShowById,
  showQueryValidation,
  showValidation,
  updateShow,
} = require('../controllers/showController');
const { adminOnly, protect } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.get('/', showQueryValidation, validateRequest, getAllShows);
router.get('/:id/seats', getAvailableSeats);
router.get('/:id', getShowById);
router.post('/', protect, adminOnly, showValidation(), validateRequest, createShow);
router.put('/:id', protect, adminOnly, showValidation(true), validateRequest, updateShow);
router.delete('/:id', protect, adminOnly, deleteShow);

module.exports = router;
