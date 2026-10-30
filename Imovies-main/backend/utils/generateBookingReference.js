const { randomBytes } = require('crypto');

const generateBookingReference = () =>
  `IM-${Date.now().toString(36).toUpperCase()}-${randomBytes(4).toString('hex').toUpperCase()}`;

module.exports = generateBookingReference;
