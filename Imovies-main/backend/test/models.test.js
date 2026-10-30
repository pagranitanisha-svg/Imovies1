const test = require('node:test');
const assert = require('node:assert/strict');
const User = require('../models/User');
const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const Show = require('../models/Show');
const Booking = require('../models/Booking');

test('user password is excluded from query results by default', () => {
  assert.equal(User.schema.path('password').options.select, false);
  assert.equal(User.schema.path('email').options.unique, true);
});

test('movie status only accepts now_showing or upcoming', async () => {
  const movie = new Movie({
    title: 'Test',
    description: 'Description',
    duration: 100,
    releaseDate: new Date(),
    status: 'invalid',
  });
  await assert.rejects(movie.validate(), /status/);
});

test('theatre screen capacity is derived from its seat layout', async () => {
  const theatre = new Theatre({
    name: 'Test',
    location: 'Test',
    address: 'Test',
    screens: [{ name: 'Screen 1', seatLayout: { rows: 5, cols: 8 } }],
  });
  await theatre.validate();
  assert.equal(theatre.screens[0].capacity, 40);
});

test('booking validation rejects duplicate seat identifiers', async () => {
  const booking = new Booking({
    bookingReference: 'IM-TEST-REFERENCE',
    user: '507f1f77bcf86cd799439011',
    show: '507f1f77bcf86cd799439012',
    movie: '507f1f77bcf86cd799439013',
    theatre: '507f1f77bcf86cd799439014',
    selectedSeats: ['A1', 'A1'],
    totalAmount: 500,
  });
  await assert.rejects(booking.validate(), /Selected seats cannot contain duplicates/);
});

test('show start time requires a 24-hour HH:mm value', async () => {
  const show = new Show({
    movie: '507f1f77bcf86cd799439011',
    theatre: '507f1f77bcf86cd799439012',
    screen: 'Screen 1',
    showDate: new Date(),
    startTime: '25:30',
    ticketPrice: 100,
    seatConfiguration: { rows: 5, cols: 5 },
  });
  await assert.rejects(show.validate(), /startTime/);
});
