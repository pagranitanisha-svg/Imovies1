const { body, query } = require('express-validator');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Movie = require('../models/Movie');
const Show = require('../models/Show');
const Theatre = require('../models/Theatre');
const asyncHandler = require('../utils/asyncHandler');
const { buildSeatList } = require('../utils/seatLayout');

const resolveScreen = async (theatreId, screenIdentifier) => {
  if (!mongoose.isValidObjectId(theatreId)) return null;
  const theatre = await Theatre.findById(theatreId);
  if (!theatre) return null;

  const screen = theatre.screens.find(
    (item) => item.name === screenIdentifier || item._id.toString() === screenIdentifier,
  );
  return screen ? { theatre, screen } : null;
};

const getAllShows = asyncHandler(async (req, res) => {
  const filter = { status: 'active' };
  if (req.query.movie) filter.movie = req.query.movie;
  if (req.query.theatre) filter.theatre = req.query.theatre;
  if (req.query.date) {
    const date = new Date(req.query.date);
    const start = new Date(`${req.query.date}T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    if (Number.isNaN(date.getTime())) {
      res.status(400);
      throw new Error('Invalid show date');
    }
    filter.showDate = { $gte: start, $lt: end };
  }

  const shows = await Show.find(filter)
    .populate('movie theatre')
    .sort({ showDate: 1, startTime: 1 });
  res.status(200).json({ success: true, count: shows.length, data: shows });
});

const getShowById = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400);
    throw new Error('Invalid show ID');
  }
  const show = await Show.findById(req.params.id).populate('movie theatre');
  if (!show) {
    res.status(404);
    throw new Error('Show not found');
  }
  res.status(200).json({ success: true, data: show });
});

const createShow = asyncHandler(async (req, res) => {
  const { movie, theatre, screen, showDate, startTime, ticketPrice, status } = req.body;
  if (!mongoose.isValidObjectId(movie) || !(await Movie.exists({ _id: movie }))) {
    res.status(400);
    throw new Error('A valid movie is required');
  }
  const resolvedScreen = await resolveScreen(theatre, screen);
  if (!resolvedScreen) {
    res.status(400);
    throw new Error('A valid theatre and screen are required');
  }
  const show = await Show.create({
    movie,
    theatre: resolvedScreen.theatre._id,
    screen: resolvedScreen.screen.name,
    showDate,
    startTime,
    ticketPrice,
    status,
    seatConfiguration: {
      rows: resolvedScreen.screen.seatLayout.rows,
      cols: resolvedScreen.screen.seatLayout.cols,
    },
  });
  res.status(201).json({ success: true, message: 'Show created successfully', data: show });
});

const updateShow = asyncHandler(async (req, res) => {
  const show = await Show.findById(req.params.id);
  if (!show) {
    res.status(404);
    throw new Error('Show not found');
  }

  if (show.bookedSeats.length > 0 && ['theatre', 'screen'].some((key) => req.body[key] !== undefined)) {
    res.status(409);
    throw new Error('Cannot change a show screen after seats have been reserved');
  }

  const updates = {};
  for (const key of ['movie', 'showDate', 'startTime', 'ticketPrice', 'status']) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  if (updates.movie && (!mongoose.isValidObjectId(updates.movie) || !(await Movie.exists({ _id: updates.movie })))) {
    res.status(400);
    throw new Error('A valid movie is required');
  }
  if (req.body.theatre !== undefined || req.body.screen !== undefined) {
    const theatreId = req.body.theatre || show.theatre.toString();
    const screenIdentifier = req.body.screen || show.screen;
    const resolvedScreen = await resolveScreen(theatreId, screenIdentifier);
    if (!resolvedScreen) {
      res.status(400);
      throw new Error('A valid theatre and screen are required');
    }
    updates.theatre = resolvedScreen.theatre._id;
    updates.screen = resolvedScreen.screen.name;
    updates.seatConfiguration = {
      rows: resolvedScreen.screen.seatLayout.rows,
      cols: resolvedScreen.screen.seatLayout.cols,
    };
  }

  Object.assign(show, updates);
  await show.save();
  res.status(200).json({ success: true, data: show });
});

const deleteShow = asyncHandler(async (req, res) => {
  const show = await Show.findById(req.params.id);
  if (!show) {
    res.status(404);
    throw new Error('Show not found');
  }
  if (show.bookedSeats.length > 0 || await Booking.exists({ show: show._id })) {
    res.status(409);
    throw new Error('Cannot delete a show referenced by bookings or reserved seats');
  }
  await show.deleteOne();
  res.status(200).json({ success: true, message: 'Show deleted successfully' });
});

const getAvailableSeats = asyncHandler(async (req, res) => {
  const show = await Show.findById(req.params.id);
  if (!show) {
    res.status(404);
    throw new Error('Show not found');
  }

  const allSeats = buildSeatList(show.seatConfiguration.rows, show.seatConfiguration.cols);
  const bookedSeats = show.bookedSeats;
  res.status(200).json({
    success: true,
    data: {
      showId: show._id,
      totalSeats: allSeats.length,
      bookedSeats,
      availableSeats: allSeats.filter((seat) => !bookedSeats.includes(seat)),
    },
  });
});

const showValidation = (partial = false) => [
  body('movie').if((_, { req }) => !partial || req.body.movie !== undefined).isMongoId(),
  body('theatre').if((_, { req }) => !partial || req.body.theatre !== undefined).isMongoId(),
  body('screen').if((_, { req }) => !partial || req.body.screen !== undefined).isString().trim().notEmpty(),
  body('showDate').if((_, { req }) => !partial || req.body.showDate !== undefined).isISO8601(),
  body('startTime').if((_, { req }) => !partial || req.body.startTime !== undefined).matches(/^([01]\d|2[0-3]):[0-5]\d$/),
  body('ticketPrice').if((_, { req }) => !partial || req.body.ticketPrice !== undefined).isFloat({ min: 0 }),
  body('status').optional().isIn(['active', 'cancelled']),
];

const showQueryValidation = [
  query('movie').optional().isMongoId(),
  query('theatre').optional().isMongoId(),
  query('date').optional().isISO8601({ strict: true, strictSeparator: true }),
];

module.exports = {
  getAllShows,
  getShowById,
  createShow,
  updateShow,
  deleteShow,
  getAvailableSeats,
  showValidation,
  showQueryValidation,
};
