# iMovies Backend API Testing Guide

The API requires a running backend and a reachable MongoDB Atlas cluster. Set `MONGO_URI`, `JWT_SECRET`, and `CLIENT_URL` in the ignored `backend/.env` before starting it. Do not paste credentials into commands or share terminal output containing secrets.

Start the backend from PowerShell:

```powershell
cd C:\Users\hp\OneDrive\Desktop\Imovies\backend
npm run dev
```

Use `curl.exe` (not PowerShell's `curl` alias). The examples below use `http://localhost:5000`.

## Health

```powershell
curl.exe http://localhost:5000/api/health
```

When Atlas is connected, expect HTTP 200 and `database: "connected"`. If the database becomes unavailable, health returns HTTP 503; regular `/api` endpoints also return 503 until readiness is restored.

## Authentication

Register a regular account. Password must be at least 8 characters and contain uppercase, lowercase, and numeric characters:

```powershell
$register = '{"name":"Taylor User","email":"taylor@example.test","password":"ReplaceThis9WithYourOwn"}'
$registered = curl.exe -s -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d $register | ConvertFrom-Json
$token = $registered.token
$token
```

Login:

```powershell
$login = '{"email":"taylor@example.test","password":"ReplaceThis9WithYourOwn"}'
$loggedIn = curl.exe -s -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d $login | ConvertFrom-Json
$token = $loggedIn.token
```

Current user:

```powershell
curl.exe http://localhost:5000/api/auth/me -H "Authorization: Bearer $token"
```

Verify invalid login (401), duplicate registration (409), missing/invalid/expired token (401), and that responses never contain the password hash. The user registration endpoint ignores client-supplied role fields; only the seed process can establish the first admin.

## Movies

```powershell
curl.exe "http://localhost:5000/api/movies?page=1&limit=12&search=north&genre=Adventure&language=English&status=now_showing"
curl.exe http://localhost:5000/api/movies/MOVIE_ID
```

Movie creation example (admin token required):

```powershell
$movie = '{"title":"Sample Feature","description":"A sample movie for API testing.","genre":["Drama"],"language":"English","duration":110,"rating":7.5,"releaseDate":"2026-10-30","status":"now_showing"}'
curl.exe -X POST http://localhost:5000/api/movies -H "Authorization: Bearer ADMIN_TOKEN" -H "Content-Type: application/json" -d $movie
```

Also test `PUT /api/movies/:id` and `DELETE /api/movies/:id`. Non-admin create, update, and delete requests must return 403. Deleting a movie referenced by shows must return 409.

## Theatres

```powershell
curl.exe http://localhost:5000/api/theatres
curl.exe http://localhost:5000/api/theatres/THEATRE_ID
```

Admin create example:

```powershell
$theatre = '{"name":"Sample Cinema","location":"Central","address":"10 Main Street","screens":[{"name":"Screen 1","seatLayout":{"rows":6,"cols":10}}]}'
curl.exe -X POST http://localhost:5000/api/theatres -H "Authorization: Bearer ADMIN_TOKEN" -H "Content-Type: application/json" -d $theatre
```

Also test admin `PUT` and `DELETE`. Invalid screen layout should return 400. Updating screen configuration or deleting a theatre referenced by shows should return 409.

## Shows and Seat Availability

```powershell
curl.exe "http://localhost:5000/api/shows?movie=MOVIE_ID&theatre=THEATRE_ID&date=2026-10-31"
curl.exe http://localhost:5000/api/shows/SHOW_ID
curl.exe http://localhost:5000/api/shows/SHOW_ID/seats
```

Admin create example; `screen` may be its exact screen name or screen ID:

```powershell
$show = '{"movie":"MOVIE_ID","theatre":"THEATRE_ID","screen":"Screen 1","showDate":"2026-10-31","startTime":"19:30","ticketPrice":250}'
curl.exe -X POST http://localhost:5000/api/shows -H "Authorization: Bearer ADMIN_TOKEN" -H "Content-Type: application/json" -d $show
```

For now, the API interprets `showDate` and `startTime` as UTC when checking whether a show has started or can be cancelled.

Also test admin `PUT` and `DELETE`. A show cannot be deleted while referenced by bookings or while seats are reserved. Seat availability uses the selected screen's seat layout.

## Bookings

Use a real available show ID:

```powershell
$booking = '{"showId":"SHOW_ID","selectedSeats":["A1","A2"],"totalAmount":1}'
curl.exe -X POST http://localhost:5000/api/bookings -H "Authorization: Bearer $token" -H "Content-Type: application/json" -d $booking
```

The supplied `totalAmount` above is deliberately ignored; the API calculates the total from the stored ticket price. Test:

```powershell
curl.exe http://localhost:5000/api/bookings/my-bookings -H "Authorization: Bearer $token"
curl.exe http://localhost:5000/api/bookings/BOOKING_ID -H "Authorization: Bearer $token"
curl.exe -X PATCH http://localhost:5000/api/bookings/BOOKING_ID/cancel -H "Authorization: Bearer $token"
curl.exe http://localhost:5000/api/bookings -H "Authorization: Bearer ADMIN_TOKEN"
```

Expected security and conflict checks:

- Booking without authentication: 401
- Invalid show/seat: 400 or 404
- Already-booked seat: 409
- Two concurrent requests for the same seat: exactly one reservation succeeds; the other receives 409
- Accessing another user's booking: 403
- Cancelling after show start or cancelling twice: 409
- Successful cancellation before show start: cancelled status and seats become available again
- Regular user requesting the admin booking list: 403

## Seed and Admin Setup

```powershell
cd C:\Users\hp\OneDrive\Desktop\Imovies\backend
npm run seed
```

The script safely creates or retains 10 movies, 3 theatres, showtimes, and (if all three admin environment values are set) one initial admin. It never deletes data or changes an existing account's role/password.

## Phase 3 Final / Phase 4 Verification Record

Configuration was rechecked on 2026-10-30. These are the actual results for the current local configuration:

| Check | Result | Evidence |
|---|---|---|
| Atlas URI configuration | Blocked | `MONGO_URI` is set in `backend/.env` and has the `mongodb+srv://` scheme, but still contains example placeholders. The value was not printed. |
| JWT configuration | Blocked | `JWT_SECRET` is present but does not satisfy the configured minimum strength/non-placeholder check. Its value was not printed. `NODE_ENV` is unset; it is optional for startup. |
| Atlas connection/readiness | Not run | The latest check stopped before database operations. Earlier startup verification rejected the placeholder before attempting network access. Atlas connection has not been established or claimed. |
| `/api/health` connected response (HTTP 200) | Not run | The server cannot start until a real Atlas URI and valid environment settings are configured. The automated health test instead verifies HTTP 503 when disconnected. |
| Seed against Atlas and record counts | Not run | An earlier `npm run seed` attempt safely stopped at the placeholder configuration check. No Atlas data was inserted or changed. |
| Auth, movie, theatre, show, and booking API checks | Not run | These require a live database-backed server. No database-backed API requests were made. |
| Simultaneous duplicate-seat requests | Not run | Requires a live Atlas replica set. The implementation uses a transaction and conditional `bookedSeats` update, but runtime conflict behavior is unverified. |
| Backend automated test suite | Passed | `npm test`: 12 passed, 0 failed. These tests are model/config/health/seat-layout unit checks, not Atlas integration tests. |
| Backend JavaScript syntax check | Passed | All 33 project-owned backend JavaScript files parsed successfully. |

Phase 5 recheck: `backend/.env` still fails the local Atlas URI and JWT strength checks. The expanded unit suite now also rejects common Atlas URI placeholders and weak JWT values. No connection, seed, or database-backed API request was executed; the 12 passing tests are not Atlas integration tests.

Configure a real Atlas URI and a unique, high-entropy `JWT_SECRET` of at least 32 characters locally, then rerun the commands and API scenarios in this guide. Keep credentials out of terminal transcripts and reports. Do not mark the Atlas/API/seed/concurrency checks complete until their responses and collection counts have been observed.
