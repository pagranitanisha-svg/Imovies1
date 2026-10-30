require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcrypt');
const connectDB = require('../config/db').connectDB;
const { disconnectDB } = require('../config/db');
const User = require('../models/User');
const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const Show = require('../models/Show');

const movies = [
  ['Northbound', 'A mountaineer follows a signal beyond the mapped trails.', ['Adventure', 'Drama'], 'English', 116, 7.8, 'now_showing'],
  ['Paper Moons', 'Two siblings discover a hidden cinema in their coastal town.', ['Drama', 'Family'], 'English', 104, 8.1, 'now_showing'],
  ['The Last Frequency', 'A radio astronomer receives a pattern from a distant star.', ['Sci-Fi', 'Thriller'], 'English', 128, 8.4, 'now_showing'],
  ['Monsoon Letters', 'A misplaced letter reconnects two old friends.', ['Romance', 'Drama'], 'Hindi', 121, 7.6, 'now_showing'],
  ['Copper City', 'An apprentice detective uncovers a decades-old mystery.', ['Mystery', 'Crime'], 'English', 113, 7.9, 'now_showing'],
  ['Small Hours', 'A night-shift baker finds unexpected company in the city.', ['Comedy', 'Drama'], 'English', 98, 7.4, 'now_showing'],
  ['Wild Orchard', 'A family works together to save their ancestral orchard.', ['Family', 'Drama'], 'Tamil', 109, 7.7, 'now_showing'],
  ['Orbit Seven', 'A stranded crew races to restore their spacecraft.', ['Sci-Fi', 'Adventure'], 'English', 132, 8.2, 'upcoming'],
  ['The Blue Kite', 'A young artist plans one last summer with her grandfather.', ['Family', 'Adventure'], 'Hindi', 101, 7.5, 'upcoming'],
  ['After the Encore', 'A retired musician returns to the stage for one final performance.', ['Music', 'Drama'], 'English', 119, 8.0, 'upcoming'],
];

const theatreData = [
  ['Crescent Cinemas', 'Central District', '12 Crescent Avenue', [
    { name: 'Screen 1', seatLayout: { rows: 8, cols: 12 } },
    { name: 'Screen 2', seatLayout: { rows: 6, cols: 10 } },
  ]],
  ['Harbor Picture House', 'Harborfront', '48 Lighthouse Road', [
    { name: 'Screen 1', seatLayout: { rows: 7, cols: 12 } },
    { name: 'Screen 2', seatLayout: { rows: 6, cols: 10 } },
  ]],
  ['Maple Multiplex', 'North Quarter', '205 Maple Street', [
    { name: 'Screen 1', seatLayout: { rows: 8, cols: 14 } },
    { name: 'Screen 2', seatLayout: { rows: 6, cols: 10 } },
  ]],
];

const seedAdmin = async () => {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  const supplied = [ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD].filter(Boolean).length;
  if (supplied === 0) {
    console.log('Admin seed skipped; set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD to create an initial admin.');
    return;
  }
  if (supplied !== 3) throw new Error('Provide all three ADMIN_* environment variables to create the initial admin.');
  if (ADMIN_PASSWORD.length < 12 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(ADMIN_PASSWORD)) {
    throw new Error('ADMIN_PASSWORD must be at least 12 characters and include uppercase, lowercase, and numeric characters.');
  }

  const email = ADMIN_EMAIL.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('ADMIN_EMAIL must be a valid email address.');
  }
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    if (existingUser.role !== 'admin') {
      throw new Error('ADMIN_EMAIL already belongs to a non-admin account; no role was changed.');
    }
    console.log('Existing admin account retained; no credentials or user data were changed.');
    return;
  }

  await User.create({
    name: ADMIN_NAME.trim(),
    email,
    password: await bcrypt.hash(ADMIN_PASSWORD, 12),
    role: 'admin',
  });
  console.log('Initial admin account created from environment configuration.');
};

const seed = async () => {
  await connectDB();
  try {
    const seededMovies = [];
    for (const [title, description, genre, language, duration, rating, status] of movies) {
      const movie = await Movie.findOneAndUpdate(
        { title },
        {
          $setOnInsert: {
            title,
            description,
            poster: '',
            banner: '',
            genre,
            language,
            duration,
            rating,
            releaseDate: new Date(status === 'upcoming' ? '2027-01-15T00:00:00.000Z' : '2026-10-01T00:00:00.000Z'),
            cast: [],
            director: 'iMovies Sample Data',
            status,
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      );
      seededMovies.push(movie);
    }

    const seededTheatres = [];
    for (const [name, location, address, screens] of theatreData) {
      const configuredScreens = screens.map((screen) => ({
        ...screen,
        capacity: screen.seatLayout.rows * screen.seatLayout.cols,
      }));
      const theatre = await Theatre.findOneAndUpdate(
        { name },
        { $setOnInsert: { name, location, address, screens: configuredScreens } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      );
      seededTheatres.push(theatre);
    }

    const showDate = new Date();
    showDate.setUTCDate(showDate.getUTCDate() + 1);
    showDate.setUTCHours(0, 0, 0, 0);
    const featuredMovies = seededMovies.slice(0, 4);
    for (let theatreIndex = 0; theatreIndex < seededTheatres.length; theatreIndex += 1) {
      const theatre = seededTheatres[theatreIndex];
      const screen = theatre.screens[0];
      for (let movieIndex = 0; movieIndex < featuredMovies.length; movieIndex += 1) {
        for (const startTime of ['14:00', '19:30']) {
          await Show.updateOne(
            {
              movie: featuredMovies[movieIndex]._id,
              theatre: theatre._id,
              showDate,
              startTime,
            },
            {
              $setOnInsert: {
                movie: featuredMovies[movieIndex]._id,
                theatre: theatre._id,
                screen: screen.name,
                showDate,
                startTime,
                ticketPrice: 250 + theatreIndex * 50,
                seatConfiguration: screen.seatLayout,
                status: 'active',
              },
            },
            { upsert: true },
          );
        }
      }
    }

    await seedAdmin();
    console.log(`Seed complete: ${seededMovies.length} movies, ${seededTheatres.length} theatres, and showtimes created or retained.`);
  } finally {
    await disconnectDB();
  }
};

seed().catch((error) => {
  console.error(`Seed failed (${error.name || 'unknown error'}). Verify database connectivity and seed configuration.`);
  process.exitCode = 1;
});
