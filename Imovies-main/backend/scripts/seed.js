require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcrypt');
const connectDB = require('../config/db').connectDB;
const { disconnectDB } = require('../config/db');
const User = require('../models/User');
const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const Show = require('../models/Show');

const movies = [ ['3 Idiots', 'Three engineering students challenge the pressure and expectations of college life.', ['Comedy', 'Drama'], 'Hindi', 170, 8.4, 'now_showing'],
  ['Dangal', 'A former wrestler trains his daughters to become world-class wrestlers.', ['Biography', 'Drama', 'Sport'], 'Hindi', 161, 8.3, 'now_showing'],
  ['Jawan', 'A man driven by a personal mission takes on corruption and injustice.', ['Action', 'Thriller'], 'Hindi', 169, 7.0, 'now_showing'],
  ['Pathaan', 'An Indian spy returns to stop a dangerous global threat.', ['Action', 'Thriller'], 'Hindi', 146, 5.9, 'now_showing'],
  ['Animal', 'A complex father-son relationship leads to a violent journey.', ['Action', 'Crime', 'Drama'], 'Hindi', 201, 6.2, 'now_showing'],
  ['KGF Chapter 2', 'Rocky rises to power while enemies attempt to bring him down.', ['Action', 'Crime', 'Drama'], 'Kannada', 168, 8.2, 'now_showing'],
  ['Shershaah', 'The story of an Indian Army officer and his courage during the Kargil War.', ['Biography', 'War', 'Drama'], 'Hindi', 135, 8.3, 'now_showing'],
  ['Chhaava', 'A historical drama about the life and bravery of Chhatrapati Sambhaji Maharaj.', ['Action', 'History', 'Drama'], 'Hindi', 161, 7.3, 'now_showing'],
  ['Drishyam 2', 'A family faces a new investigation years after a mysterious incident.', ['Crime', 'Thriller', 'Drama'], 'Hindi', 140, 8.2, 'now_showing'],
  ['Zindagi Na Milegi Dobara', 'Three friends take a life-changing road trip through Spain.', ['Adventure', 'Comedy', 'Drama'], 'Hindi', 153, 8.2, 'now_showing'],

  ['Inception', 'A skilled thief enters dreams to steal secrets and attempt an impossible mission.', ['Sci-Fi', 'Action', 'Thriller'], 'English', 148, 8.8, 'now_showing'],
  ['Interstellar', 'A team of explorers travels beyond this galaxy to find a future for humanity.', ['Sci-Fi', 'Drama', 'Adventure'], 'English', 169, 8.7, 'now_showing'],
  ['Avengers: Endgame', 'The Avengers unite for one final attempt to restore the universe.', ['Action', 'Adventure', 'Sci-Fi'], 'English', 181, 8.4, 'now_showing'],
  ['The Dark Knight', 'Batman faces a criminal mastermind who throws Gotham into chaos.', ['Action', 'Crime', 'Drama'], 'English', 152, 9.0, 'now_showing'],
  ['Titanic', 'Two passengers from different worlds fall in love aboard a doomed ship.', ['Romance', 'Drama'], 'English', 195, 7.9, 'now_showing'],
  ['Avatar', 'A marine becomes part of an alien world and its struggle for survival.', ['Sci-Fi', 'Adventure', 'Action'], 'English', 162, 7.9, 'now_showing'],
  ['Spider-Man: No Way Home', 'Peter Parker faces unexpected consequences after his identity is revealed.', ['Action', 'Adventure', 'Sci-Fi'], 'English', 148, 8.2, 'now_showing'],
  ['Jurassic Park', 'A dinosaur theme park turns into a fight for survival.', ['Adventure', 'Sci-Fi', 'Thriller'], 'English', 127, 8.2, 'now_showing'],
  ['Joker', 'A troubled comedian descends into chaos in Gotham City.', ['Crime', 'Drama', 'Thriller'], 'English', 122, 8.3, 'now_showing'],
  ['Oppenheimer', 'The story of the scientist behind the development of the atomic bomb.', ['Biography', 'Drama', 'History'], 'English', 180, 8.3, 'now_showing'],
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
