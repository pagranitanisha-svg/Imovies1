const express = require('express');
const {
  addMovie,
  deleteMovie,
  getAllMovies,
  getMovieById,
  movieQueryValidation,
  movieValidation,
  updateMovie,
} = require('../controllers/movieController');
const { adminOnly, protect } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.get('/', movieQueryValidation, validateRequest, getAllMovies);
router.get('/:id', getMovieById);
router.post('/', protect, adminOnly, movieValidation(), validateRequest, addMovie);
router.put('/:id', protect, adminOnly, movieValidation(true), validateRequest, updateMovie);
router.delete('/:id', protect, adminOnly, deleteMovie);

module.exports = router;
