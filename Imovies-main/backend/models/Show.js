const mongoose = require('mongoose');

const showSchema = new mongoose.Schema(
  {
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
    screen: {
      type: String,
      required: true,
    },
    showDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    ticketPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    seatConfiguration: {
      rows: { type: Number, required: true, min: 1, max: 26 },
      cols: { type: Number, required: true, min: 1, max: 50 },
    },
    bookedSeats: {
      type: [String],
      default: [],
      validate: {
        validator: (seats) => new Set(seats).size === seats.length,
        message: 'Booked seats cannot contain duplicates',
      },
    },
    status: {
      type: String,
      enum: ['active', 'cancelled'],
      default: 'active',
    },
  },
  { timestamps: true },
);

showSchema.index({ movie: 1, theatre: 1, showDate: 1, startTime: 1 }, { unique: true });

module.exports = mongoose.model('Show', showSchema);
