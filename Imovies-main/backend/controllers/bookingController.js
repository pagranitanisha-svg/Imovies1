const { body } = require('express-validator');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Show = require('../models/Show');
const asyncHandler = require('../utils/asyncHandler');
const generateBookingReference = require('../utils/generateBookingReference');
const { buildSeatList } = require('../utils/seatLayout');
const { getShowStart } = require('../utils/showTime');

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getUserBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate('show movie theatre')
    .sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: bookings.length, data: bookings });
});

const getBookingById = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400);
    throw new Error('Invalid booking ID');
  }
  const booking = await Booking.findById(req.params.id).populate('show movie theatre user');
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }
  if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('You are not allowed to access this booking');
  }
  res.status(200).json({ success: true, data: booking });
});

const getAllBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find().populate('user show movie theatre').sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: bookings.length, data: bookings });
});

const createBooking = asyncHandler(async (req, res) => {
  const { showId, selectedSeats } = req.body;
  if (!mongoose.isValidObjectId(showId)) {
    res.status(400);
    throw new Error('Invalid show ID');
  }
  if (new Set(selectedSeats).size !== selectedSeats.length) {
    res.status(400);
    throw new Error('Selected seats must not contain duplicates');
  }

  const show = await Show.findById(showId);
  if (!show) {
    res.status(404);
    throw new Error('Show not found');
  }
  if (show.status !== 'active') {
    res.status(400);
    throw new Error('This show is not available for booking');
  }
  if (getShowStart(show) <= new Date()) {
    res.status(400);
    throw new Error('This show has already started');
  }

  const validSeats = new Set(buildSeatList(show.seatConfiguration.rows, show.seatConfiguration.cols));
  const invalidSeats = selectedSeats.filter((seat) => !validSeats.has(seat));
  if (invalidSeats.length > 0) {
    res.status(400);
    throw new Error(`Invalid seat selection: ${invalidSeats.join(', ')}`);
  }

  const session = await mongoose.startSession();
  let booking;
  try {
    await session.withTransaction(async () => {
      const reservedShow = await Show.findOneAndUpdate(
        {
          _id: show._id,
          status: 'active',
          bookedSeats: { $nin: selectedSeats },
          movie: show.movie,
          theatre: show.theatre,
          screen: show.screen,
          showDate: show.showDate,
          startTime: show.startTime,
          ticketPrice: show.ticketPrice,
          'seatConfiguration.rows': show.seatConfiguration.rows,
          'seatConfiguration.cols': show.seatConfiguration.cols,
        },
        { $addToSet: { bookedSeats: { $each: selectedSeats } } },
        { new: true, session },
      );
      if (!reservedShow) {
        throw createHttpError(409, 'The show changed or one or more selected seats were booked. Refresh and try again.');
      }

      const [createdBooking] = await Booking.create([{
        bookingReference: generateBookingReference(),
        user: req.user._id,
        show: reservedShow._id,
        movie: reservedShow.movie,
        theatre: reservedShow.theatre,
        selectedSeats,
        totalAmount: selectedSeats.length * reservedShow.ticketPrice,
        paymentStatus: 'demo-paid',
        bookingStatus: 'confirmed',
      }], { session });
      booking = createdBooking;
    });
  } finally {
    await session.endSession();
  }

  res.status(201).json({
    success: true,
    message: 'Demo payment confirmed. Booking created successfully.',
    data: booking,
  });
});

const cancelBooking = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400);
    throw new Error('Invalid booking ID');
  }
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }
  if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('You are not allowed to cancel this booking');
  }
  const session = await mongoose.startSession();
  let cancelledBooking;
  try {
    await session.withTransaction(async () => {
      const ownershipFilter = req.user.role === 'admin' ? {} : { user: req.user._id };
      const currentBooking = await Booking.findOne({
        _id: booking._id,
        bookingStatus: 'confirmed',
        ...ownershipFilter,
      }).session(session);
      if (!currentBooking) {
        throw createHttpError(409, 'Booking was already changed; refresh and try again');
      }

      const show = await Show.findById(currentBooking.show).session(session);
      if (!show || getShowStart(show) <= new Date()) {
        throw createHttpError(409, 'Bookings can only be cancelled before the show starts');
      }

      currentBooking.bookingStatus = 'cancelled';
      currentBooking.paymentStatus = 'cancelled';
      await currentBooking.save({ session });

      const seatRelease = await Show.updateOne(
        { _id: show._id, bookedSeats: { $all: currentBooking.selectedSeats } },
        { $pullAll: { bookedSeats: currentBooking.selectedSeats } },
        { session },
      );
      if (seatRelease.matchedCount !== 1) {
        throw createHttpError(409, 'Reserved seats could not be verified; cancellation was not applied');
      }
      cancelledBooking = currentBooking;
    });
  } finally {
    await session.endSession();
  }

  res.status(200).json({
    success: true,
    message: 'Booking cancelled and seats released successfully',
    data: cancelledBooking,
  });
});

const bookingValidation = [
  body('showId').isMongoId().withMessage('A valid show ID is required'),
  body('selectedSeats').isArray({ min: 1 }).withMessage('Select at least one seat'),
  body('selectedSeats.*').isString().matches(/^[A-Z](?:[1-9]|[1-4]\d|50)$/).withMessage('Seat identifiers must be valid'),
];

module.exports = {
  getUserBookings,
  getBookingById,
  getAllBookings,
  createBooking,
  cancelBooking,
  bookingValidation,
};
