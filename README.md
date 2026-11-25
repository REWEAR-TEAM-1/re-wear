# RE:WEAR

RE:WEAR is a sustainable fashion marketplace for clothing sellers, buyers, and redesign designers. It helps give unsold and pre-loved clothing a second life through a searchable catalog, seller listings, and a lightweight matching prototype.

## Stack

- **Frontend:** React, TypeScript, and Vite
- **Backend:** Java 21, Spring Boot, and Spring Data JPA
- **Database:** MySQL 8

The presentation describes a 15-week product plan, seller/buyer/designer connections, and an AI-matching prototype. The matching feature in this MVP is a transparent, local scoring prototype; it does not call an external AI service.

## Run locally

### Prerequisites

- Node.js 22.12+
- Java 21+
- Docker with Docker Compose, or a local MySQL 8 instance

1. Start MySQL:

   ```sh
   docker compose up -d db
   ```

   Compose creates the `rewear` database and a local `rewear` user. To use a different MySQL instance, set `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` before starting the backend. Set `CORS_ALLOWED_ORIGINS` to a comma-separated list when serving the frontend from a different origin. Uploaded images are stored in `backend/uploads/` by default; set `UPLOADS_DIRECTORY` to choose another persistent directory.

2. Start the API (from the repository root):

   ```sh
   ./mvnw -f backend/pom.xml spring-boot:run
   ```

   The API is available at `http://localhost:8080/api`. The first run downloads Maven and dependencies. For a local Maven installation, `mvn -f backend/pom.xml spring-boot:run` also works.

3. In a second terminal, start the frontend:

   ```sh
   cd frontend
   npm ci
   npm run dev
   ```

   Open the URL printed by Vite (normally `http://localhost:5173`). Vite proxies `/api` requests to the backend. For a separately hosted API, set `VITE_API_BASE_URL` to its origin when building the frontend.

The backend seeds a small demo catalog only when the database is empty. Listings created in the app are saved in MySQL.

To try the app without installing MySQL or Docker, start the API with the in-memory demo database instead:

```sh
SPRING_PROFILES_ACTIVE=demo ./mvnw -f backend/pom.xml spring-boot:run
```

The demo profile resets its data when the API stops; use the default MySQL configuration for persistent listings.

## Production deployment

The app can be deployed with a Vercel frontend, a Render backend, and Railway MySQL. Keep provider credentials in their dashboards; never commit them to this repository.

### Railway MySQL

Create a MySQL service and use its public connection host, port, database name, username, and password in Render. Set `DB_URL` to a JDBC URL in this form:

```text
jdbc:mysql://HOST:PORT/DATABASE?useSSL=true&allowPublicKeyRetrieval=true&serverTimezone=UTC
```

Set the corresponding `DB_USERNAME` and `DB_PASSWORD` values in Render. The backend already reads those environment variables, as well as Render's `PORT`.

### Render backend

Create a web service from this repository and select **Docker** as the runtime. Use the repository root as the build context and the root `Dockerfile`; set the health-check path to `/api/health`.

Set these Render environment variables:

| Variable | Value |
| --- | --- |
| `DB_URL` | Railway JDBC URL described above |
| `DB_USERNAME` | Railway MySQL username |
| `DB_PASSWORD` | Railway MySQL password |
| `CORS_ALLOWED_ORIGINS` | The production Vercel origin, for example `https://your-app.vercel.app` |
| `UPLOADS_DIRECTORY` | `/app/uploads` when a persistent disk is mounted there |

Uploaded images are stored on the backend filesystem. Render's filesystem is ephemeral by default, so attach a persistent disk mounted at `/app/uploads` before accepting real photo uploads. Render persistent disks require a paid web-service plan; without a disk or external object storage, uploaded photos can disappear after a restart or deploy.

### Vercel frontend

Import the same GitHub repository, set the project root directory to `frontend`, and use the Vite defaults (`npm run build`, output directory `dist`).

For session-based sign-in to work reliably across browsers, route API and image requests through the Vercel origin instead of calling the Render hostname directly. After Render provides the backend URL, add `frontend/vercel.json` with rewrites for `/api/:path*` to `https://YOUR-RENDER-SERVICE.onrender.com/api/:path*` and `/uploads/:path*` to `https://YOUR-RENDER-SERVICE.onrender.com/uploads/:path*`; replace the example hostname with the actual Render service URL. Leave `VITE_API_BASE_URL` unset in Vercel so the frontend uses these same-origin paths. Redeploy Vercel after adding the rewrites.

Do not use the development server (`npm run dev`) as the production frontend. After deployment, verify sign-up/sign-in, listing creation, and photo upload using the Vercel URL.

## Features

- Browse and search sale pieces and redesign services.
- Switch the interface between English, Korean, Vietnamese, Simplified Chinese, Uzbek, and Russian. Listing descriptions stay in the language entered by their seller.
- Filter by category, size, listing type, and maximum price.
- Create listings for a sale item or a designer redesign offer.
- Register and sign in with an email and password; passwords are stored as PBKDF2 hashes and sessions use CSRF protection.
- Require a signed-in account to upload listing photos or publish listings; seller names come from the account profile.
- Upload listing photos from a phone or computer (JPG, PNG, GIF, or WEBP; up to 5 MB).
- Save favorite listings in the current browser.
- Get ranked suggestions from the local matching prototype using category and size preferences.
- REST API validation and focused backend/frontend tests.

Direct messaging and checkout are not part of this first MVP.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Check API availability |
| `GET` | `/api/listings` | List listings; supports `q`, `category`, `type`, and `maxPrice` filters |
| `POST` | `/api/auth/signup` | Create an account and start a session |
| `POST` | `/api/auth/signin` | Sign in and start a session |
| `GET` | `/api/auth/me` | Read the current session |
| `POST` | `/api/auth/signout` | End the current session |
| `GET` | `/api/auth/csrf` | Get a CSRF token for form submissions |
| `POST` | `/api/listings` | Create a listing (requires a signed-in session and CSRF token) |
| `POST` | `/api/uploads` | Upload an image (requires a signed-in session and CSRF token) |

Listing categories are `TOPS`, `BOTTOMS`, `DRESSES`, `OUTERWEAR`, and `ACCESSORIES`. Conditions are `NEW`, `LIKE_NEW`, `GOOD`, and `REWORKABLE`. Types are `SALE` and `REDESIGN`.

## Checks

```sh
./mvnw -f backend/pom.xml test
cd frontend && npm ci && npm test -- --run
cd frontend && npm run build
```

GitHub Actions runs the backend tests and frontend tests/build on pushes and pull requests. The `develop` branch is the shared integration branch. GitHub rejected branch-protection/ruleset access for this private repository because the current plan does not include that feature.
