const { body, query } = require('express-validator');
const mongoose = require('mongoose');
const Movie = require('../models/Movie');
const Show = require('../models/Show');
const asyncHandler = require('../utils/asyncHandler');

const movieFields = [
  'title',
  'description',
  'poster',
  'banner',
  'genre',
  'language',
  'duration',
  'rating',
  'releaseDate',
  'cast',
  'director',
  'status',
];

const pickMovieFields = (source) =>
  Object.fromEntries(Object.entries(source).filter(([key]) => movieFields.includes(key)));

const getAllMovies = asyncHandler(async (req, res) => {
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 12, 1), 100);
  const filter = {};

  if (req.query.genre) filter.genre = req.query.genre;
  if (req.query.language) filter.language = req.query.language;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) {
    const escapedSearch = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.title = { $regex: escapedSearch, $options: 'i' };
  }

  const [movies, total] = await Promise.all([
    Movie.find(filter).sort({ releaseDate: -1 }).skip((page - 1) * limit).limit(limit),
    Movie.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    count: movies.length,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    data: movies,
  });
});

const getMovieById = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400);
    throw new Error('Invalid movie ID');
  }

  const movie = await Movie.findById(req.params.id);
  if (!movie) {
    res.status(404);
    throw new Error('Movie not found');
  }

  res.status(200).json({ success: true, data: movie });
});

const addMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.create(pickMovieFields(req.body));
  res.status(201).json({ success: true, message: 'Movie added successfully', data: movie });
});

const updateMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findByIdAndUpdate(req.params.id, pickMovieFields(req.body), {
    new: true,
    runValidators: true,
  });
  if (!movie) {
    res.status(404);
    throw new Error('Movie not found');
  }

  res.status(200).json({ success: true, data: movie });
});

const deleteMovie = asyncHandler(async (req, res) => {
  if (await Show.exists({ movie: req.params.id })) {
    res.status(409);
    throw new Error('Cannot delete a movie that is referenced by shows');
  }
  const movie = await Movie.findByIdAndDelete(req.params.id);
  if (!movie) {
    res.status(404);
    throw new Error('Movie not found');
  }
  res.status(200).json({ success: true, message: 'Movie deleted successfully' });
});

const movieValidation = (partial = false) => [
  body('title').if((_, { req }) => !partial || req.body.title !== undefined).isString().trim().isLength({ min: 1, max: 160 }),
  body('description').if((_, { req }) => !partial || req.body.description !== undefined).isString().trim().isLength({ min: 1, max: 5000 }),
  body('poster').optional().isString().isLength({ max: 2048 }),
  body('banner').optional().isString().isLength({ max: 2048 }),
  body('genre').optional().isArray({ min: 1, max: 10 }),
  body('genre.*').optional().isString().trim().isLength({ min: 1, max: 40 }),
  body('language').optional().isString().trim().isLength({ min: 1, max: 40 }),
  body('duration').if((_, { req }) => !partial || req.body.duration !== undefined).isInt({ min: 1, max: 1000 }),
  body('rating').optional().isFloat({ min: 0, max: 10 }),
  body('releaseDate').if((_, { req }) => !partial || req.body.releaseDate !== undefined).isISO8601(),
  body('cast').optional().isArray({ max: 30 }),
  body('cast.*').optional().isString().trim().isLength({ max: 100 }),
  body('director').optional().isString().trim().isLength({ max: 120 }),
  body('status').optional().isIn(['now_showing', 'upcoming']),
];

const movieQueryValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('genre').optional().isString().trim().isLength({ max: 40 }),
  query('language').optional().isString().trim().isLength({ max: 40 }),
  query('status').optional().isIn(['now_showing', 'upcoming']),
  query('search').optional().isString().trim().isLength({ max: 100 }),
];

module.exports = {
  getAllMovies,
  getMovieById,
  addMovie,
  updateMovie,
  deleteMovie,
  movieValidation,
  movieQueryValidation,
};
