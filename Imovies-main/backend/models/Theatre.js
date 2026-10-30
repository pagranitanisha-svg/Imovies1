const mongoose = require('mongoose');

const screenSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    capacity: { type: Number, min: 1 },
    seatLayout: {
      rows: { type: Number, required: true, min: 1, max: 26 },
      cols: { type: Number, required: true, min: 1, max: 50 },
    },
  },
  { _id: true },
);

screenSchema.pre('validate', function setCapacity() {
  const rows = this.seatLayout?.rows;
  const cols = this.seatLayout?.cols;
  if (rows && cols) this.capacity = rows * cols;
});

const theatreSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    screens: {
      type: [screenSchema],
      required: true,
      validate: {
        validator: (screens) => screens.length > 0,
        message: 'A theatre must have at least one screen',
      },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Theatre', theatreSchema);
