# Backend Setup — StartupConnect

This document describes how to get the backend running locally and what team members should do after pulling the repository.

## Prerequisites
- Node.js v18+ and npm
- PostgreSQL (local or remote)
- Git

## Quick start (recommended)
1. Clone and checkout the branch:

```bash
git clone https://github.com/etsuamb/Startup-backend.git
cd Startup-backend/backend
git fetch origin
git checkout feat/mentor-docs
```

2. Install dependencies:

```bash
npm ci
```

3. Environment variables
- Create a `.env` file in the `backend/` folder. Example variables:

```
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=startupconnect
JWT_SECRET=some_long_secret
PORT=3000
```

4. Database setup
- Option A: Run the SQL migration manually (psql):

```bash
createdb startupconnect
psql -U $DB_USER -d startupconnect -f 001_init.sql
```

- Option B: Run the included migration helper (uses `.env` settings):

```bash
node scripts/run_migration.js
```

5. Prepare directories and admin account

```bash
mkdir -p uploads
node scripts/reset_admin_password.js   # sets admin@startupconnect.test / AdminPass123!
```

6. Start the server

```bash
npm run dev   # or `node index.js`
```

7. API testing
- Import `StartupConnect Backend API.postman_collection.json` into Postman.
- Login: POST `/api/auth/login` with the admin credentials to obtain a token.
- Add header `Authorization: Bearer <token>` for admin routes.

## Notes for team
- Do not commit `.env`, `uploads/`, or `node_modules/` — they are ignored in `.gitignore`.
- If teammates prefer Docker, we can add a `docker-compose.yml` to run Postgres + app.
- For repeatable DB changes in teams, consider adopting a migration tool (Flyway, Knex, Sequelize, or node-pg-migrate).

## Useful scripts
- `node scripts/run_migration.js` — applies `001_init.sql` and creates `uploads/` if missing.
- `node scripts/reset_admin_password.js` — creates or resets the seeded admin password.
- `node scripts/check_postman_collection.js` — validates the Postman collection contents.

## Troubleshooting
- If requests fail with `Invalid URI "http:///..."`, import the Postman collection in `backend/` (it uses absolute `http://localhost:3000` URLs).
- If you see DB column errors, ensure you ran the migration SQL or the migration script against the correct database.

If you'd like, I can add a `/.env.example` file and a `docker-compose.yml` next.

## .env.example and Docker (optional, recommended)

I added `.env.example` and a minimal `docker-compose.yml` to make onboarding easier.

1. Copy the example env and edit if needed:

```bash
cp .env.example .env
# edit .env to set real DB credentials if not using Docker
```

2. Use Docker Compose to run Postgres locally (recommended):

```bash
docker-compose up -d
```

This starts a Postgres instance with:

- user: `postgres`
- password: `postgres`
- db: `startupconnect`

3. After Postgres is running, run migration and prepare the app:

```bash
npm ci
node scripts/run_migration.js
mkdir -p uploads
node scripts/reset_admin_password.js
npm run dev
```

4. Verify in Postman by importing `StartupConnect Backend API.postman_collection.json` and logging in.

---

Files added:
- `.env.example` — sample env variables
- `docker-compose.yml` — Postgres service for local development

