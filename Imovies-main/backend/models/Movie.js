const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    description: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    poster: {
      type: String,
      default: '',
    },
    banner: {
      type: String,
      default: '',
    },
    genre: {
      type: [String],
      default: ['Drama'],
    },
    language: {
      type: String,
      default: 'English',
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    releaseDate: {
      type: Date,
      required: true,
    },
    cast: {
      type: [String],
      default: [],
    },
    director: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['now_showing', 'upcoming'],
      default: 'now_showing',
    },
  },
  { timestamps: true },
);

movieSchema.index({ title: 'text', genre: 1, language: 1, status: 1 });

module.exports = mongoose.model('Movie', movieSchema);
