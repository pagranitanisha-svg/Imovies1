const { body } = require('express-validator');
const mongoose = require('mongoose');
const Theatre = require('../models/Theatre');
const Show = require('../models/Show');
const asyncHandler = require('../utils/asyncHandler');

const theatreFields = ['name', 'location', 'address', 'screens'];
const pickTheatreFields = (source) =>
  Object.fromEntries(Object.entries(source).filter(([key]) => theatreFields.includes(key)));

const getAllTheatres = asyncHandler(async (req, res) => {
  const theatres = await Theatre.find().sort({ name: 1 });
  res.status(200).json({ success: true, count: theatres.length, data: theatres });
});

const getTheatreById = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400);
    throw new Error('Invalid theatre ID');
  }

  const theatre = await Theatre.findById(req.params.id);
  if (!theatre) {
    res.status(404);
    throw new Error('Theatre not found');
  }
  res.status(200).json({ success: true, data: theatre });
});

const addTheatre = asyncHandler(async (req, res) => {
  const theatre = await Theatre.create(pickTheatreFields(req.body));
  res.status(201).json({ success: true, message: 'Theatre added successfully', data: theatre });
});

const updateTheatre = asyncHandler(async (req, res) => {
  if (req.body.screens !== undefined && await Show.exists({ theatre: req.params.id })) {
    res.status(409);
    throw new Error('Cannot change screen configuration while shows reference this theatre');
  }
  const theatre = await Theatre.findByIdAndUpdate(req.params.id, pickTheatreFields(req.body), {
    new: true,
    runValidators: true,
  });
  if (!theatre) {
    res.status(404);
    throw new Error('Theatre not found');
  }
  res.status(200).json({ success: true, data: theatre });
});

const deleteTheatre = asyncHandler(async (req, res) => {
  if (await Show.exists({ theatre: req.params.id })) {
    res.status(409);
    throw new Error('Cannot delete a theatre that is referenced by shows');
  }
  const theatre = await Theatre.findByIdAndDelete(req.params.id);
  if (!theatre) {
    res.status(404);
    throw new Error('Theatre not found');
  }
  res.status(200).json({ success: true, message: 'Theatre deleted successfully' });
});

const theatreValidation = (partial = false) => [
  body('name').if((_, { req }) => !partial || req.body.name !== undefined).isString().trim().isLength({ min: 1, max: 120 }),
  body('location').if((_, { req }) => !partial || req.body.location !== undefined).isString().trim().isLength({ min: 1, max: 120 }),
  body('address').if((_, { req }) => !partial || req.body.address !== undefined).isString().trim().isLength({ min: 1, max: 300 }),
  body('screens')
    .if((_, { req }) => !partial || req.body.screens !== undefined)
    .isArray({ min: 1, max: 30 })
    .withMessage('At least one screen is required'),
  body('screens.*.name').if((_, { req }) => !partial || req.body.screens !== undefined).isString().trim().isLength({ min: 1, max: 80 }),
  body('screens.*.seatLayout.rows').if((_, { req }) => !partial || req.body.screens !== undefined).isInt({ min: 1, max: 26 }),
  body('screens.*.seatLayout.cols').if((_, { req }) => !partial || req.body.screens !== undefined).isInt({ min: 1, max: 50 }),
];

module.exports = {
  getAllTheatres,
  getTheatreById,
  addTheatre,
  updateTheatre,
  deleteTheatre,
  theatreValidation,
};
