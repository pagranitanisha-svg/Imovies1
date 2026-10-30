# iMovies

iMovies is a MERN movie-ticket booking project. The backend provides JWT authentication, movie and theatre discovery, show scheduling, seat availability, and demo ticket bookings.

## Technology

- Frontend: React, Vite, Bootstrap, React Router, Axios, React Icons
- Backend: Node.js, Express, Mongoose, MongoDB Atlas, JWT, bcrypt

## Project Structure

```text
backend/
  config/
  controllers/
  middleware/
  models/
  routes/
  scripts/
  test/
  utils/
frontend/
  src/
```

## Backend Setup

Use Node.js 20.19+ or 22.12+ and a MongoDB Atlas cluster.

From PowerShell:

```powershell
cd backend
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm install
npm run dev
```

Edit `backend/.env` locally. Required secrets/config:

- `MONGO_URI`: real MongoDB Atlas SRV connection URI (`mongodb+srv://...`); placeholders and local MongoDB URIs are rejected.
- `JWT_SECRET`: unique secret of at least 32 characters and at least 12 distinct characters.

Optional/defaulted:

- `JWT_EXPIRES_IN`: JWT lifetime; defaults to `7d`.
- `PORT`: HTTP port; defaults to `5000` locally. Render supplies this in production.
- `CLIENT_URL`: allowed frontend origins, comma-separated if using more than one; defaults to `http://localhost:5173` locally. Set it to the deployed Vercel origin in production.
- `NODE_ENV`: set `development` locally and `production` on Render. Production mode suppresses stack traces in API error responses.
- `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`: optional; only set temporarily when explicitly running the seed script to create the first admin.

Never upload `.env` or share real credentials.

## Seed Data and Initial Admin

Run:

```powershell
npm run seed
```

This creates or retains sample movies, theatres, and showtimes.

## API Overview

All API paths are prefixed with `/api`.

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/health` | Public | API/database readiness |
| POST | `/auth/register` | Public | Register |
| POST | `/auth/login` | Public | Login |
| GET | `/auth/me` | User | Current user |
| GET | `/movies` | Public | Movie listing |
| GET | `/movies/:id` | Public | Movie details |
| GET | `/theatres` | Public | Theatre listing |
| GET | `/shows` | Public | Show listing |
| GET | `/shows/:id/seats` | Public | Seat availability |
| POST | `/bookings` | User | Book seats |
| GET | `/bookings/my-bookings` | User | Booking history |

## Tests

From the backend folder:

```powershell
npm test
```

## Frontend

From another PowerShell window:

```powershell
cd frontend
npm install
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm run dev
```

The frontend development server defaults to `http://localhost:5173`.

Validate the frontend:

```powershell
npm run build
npm run lint
```

## Deployment: Render backend

1. In Render, choose **New → Web Service** and connect this GitHub repository.
2. Set **Root Directory** to `backend`, **Runtime** to Node, **Build Command** to `npm install`, and **Start Command** to `npm start`. The backend binds to Render's `PORT` on `0.0.0.0`.
3. Add these environment variables in the Render service's **Environment** settings:
   - `MONGO_URI`: your production/development Atlas URI for the database this deployment is intended to use. Never put it in Git or a build command.
   - `JWT_SECRET`: a newly generated, strong secret (see below).
   - `CLIENT_URL`: the exact Vercel production origin, for example `https://your-project.vercel.app` (no trailing slash). Add custom domains as comma-separated origins if needed.
   - `NODE_ENV`: `production`.
   - `JWT_EXPIRES_IN`: optional; e.g. `7d`. `PORT` is provided by Render; do not hardcode it.
4. In Render, set the health check path to `/api/health`. After deploy, open `https://<your-render-service>.onrender.com/api/health`; expect HTTP 200 and `database: "connected"`.
5. If Atlas rejects the connection, add Render's outbound network access according to your Atlas/network policy. Do not solve this by exposing credentials or broadly opening a production database.

Generate a random JWT secret locally in PowerShell and copy it to the clipboard without printing it. Paste it directly into Render's `JWT_SECRET` field:

```powershell
$bytes = New-Object byte[] 48
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
$jwtSecret = [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
Set-Clipboard -Value $jwtSecret
Write-Output "A random JWT secret was copied to the clipboard. Paste it only into Render's JWT_SECRET setting."
```

Changing `JWT_SECRET` invalidates previously issued tokens. Do not add it to `.env.example`, Vercel, source code, or a GitHub commit.

## Deployment: Vercel frontend

1. In Vercel, choose **Add New → Project**, import the same repository, and set **Root Directory** to `frontend`.
2. Use the Vite preset. Build command: `npm run build`. Output directory: `dist`. Install command can remain Vercel's default (`npm install`).
3. Add `VITE_API_URL` in the Vercel project's **Environment Variables**, with the complete Render API base, for example `https://your-render-service.onrender.com/api`. Set it for Production and Preview as appropriate. This value is a public API URL, not a secret. Production builds do not silently fall back to localhost; if the variable is missing, API screens show a configuration error.
4. Deploy or redeploy after setting the variable; Vite embeds `VITE_*` values at build time.
5. Set Render's `CLIENT_URL` to the Vercel production origin. For preview deployments, add only the exact preview origins you intend to allow (comma-separated); then redeploy the backend.
6. Confirm the Vercel homepage loads and directly visit a nested route such as `/movies`. `frontend/vercel.json` rewrites client-side routes to the Vite entry page.

Do not run `npm run seed` against a production database unless you intentionally choose that database and have reviewed the seed behavior first. The application does not seed automatically on Render.