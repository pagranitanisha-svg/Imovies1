const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    show: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Show',
      required: true,
    },
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: true,
    },
    theatre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theatre',
      required: true,
    },
    selectedSeats: {
      type: [String],
      required: true,
      default: [],
      validate: [
        {
          validator: (seats) => seats.length > 0,
          message: 'A booking must contain at least one seat',
        },
        {
          validator: (seats) => new Set(seats).size === seats.length,
          message: 'Selected seats cannot contain duplicates',
        },
      ],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['demo-paid', 'pending', 'cancelled'],
      default: 'demo-paid',
    },
    bookingStatus: {
      type: String,
      enum: ['confirmed', 'cancelled'],
      default: 'confirmed',
    },
  },
  { timestamps: true },
);

bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ show: 1, selectedSeats: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
