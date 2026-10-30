const express = require('express');
const {
  addTheatre,
  deleteTheatre,
  getAllTheatres,
  getTheatreById,
  theatreValidation,
  updateTheatre,
} = require('../controllers/theatreController');
const { adminOnly, protect } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.get('/', getAllTheatres);
router.get('/:id', getTheatreById);
router.post('/', protect, adminOnly, theatreValidation(), validateRequest, addTheatre);
router.put('/:id', protect, adminOnly, theatreValidation(true), validateRequest, updateTheatre);
router.delete('/:id', protect, adminOnly, deleteTheatre);

module.exports = router;
