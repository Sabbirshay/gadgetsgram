# Gadgets Gram Backend

Welcome to the backend service of **Gadgets Gram**, a premium e-commerce platform for tech gadgets.

This application is built on top of the **NestJS** framework and utilizes **TypeORM** for robust database interaction. It supports localized SQLite development and scales to PostgreSQL in production environments.

---

## Technical Stack

- **Framework**: [NestJS](https://nestjs.com/) (v11)
- **Database**: 
  - Local Dev: SQLite (`better-sqlite3`)
  - Production: PostgreSQL
- **ORM**: TypeORM (strictly migrations-driven)
- **Authentication**:
  - Administrative Panel: JWT-based sessions (`super_admin`, `admin`, `inventory_manager`, `marketing`, `customer_support`)
  - Customers: Supabase integration
- **File Management**: Cloudinary Integration (for product images upload)

---

## Configuration & Environment Variables

Create a `.env` file in the root of the `backend` directory. Use the following variables (refer to `.env.example`):

| Variable | Description | Default / Example |
|---|---|---|
| `NODE_ENV` | Environment stage | `development` / `production` |
| `PORT` | Running application port | `3000` |
| `JWT_SECRET` | Secret key for admin token signing | *(Required)* |
| `JWT_EXPIRATION` | Access token lifespan | `15m` |
| `JWT_REFRESH_EXPIRATION` | Refresh token lifespan | `7d` |
| `DB_DATABASE` | Local sqlite database file path | `./data/gadgets-gram.db` |
| `DATABASE_URL` | Production PostgreSQL connection string | `postgresql://...` |
| `SUPABASE_URL` | Supabase endpoint for customer auth | *(Optional / Required for customer flows)* |
| `SUPABASE_KEY` | Supabase service role key | *(Optional / Required for customer flows)* |
| `ADMIN_EMAIL` | Super Admin initial seeding email | `admin@gadgetsgram.com` |
| `ADMIN_PASSWORD` | Super Admin initial seeding password | `Admin@123456` |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | `http://localhost:8080` |

---

## Running the Application

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Database Migrations
Migrations are executed automatically upon application startup. If you need to manage migrations manually:
```bash
# Generate a new migration based on entity changes
npm run migration:generate -- src/migrations/MigrationName

# Run migrations manually
npm run migration:run

# Revert last migration
npm run migration:revert
```

### 3. Start Development Server
```bash
npm run start:dev
```

---

## Deployment

### Backend (Render)
The backend is configured for deployment to **Render** using the persistent long-running Web Service setup (`render.yaml`).
- **Build Command**: `npm install --include=dev && npm run build`
- **Start Command**: `npm run start:prod`
- Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` securely through the Render dashboard environment variables rather than committing them to source control.

### Frontend (Vercel)
The client application is deployed to **Vercel** (`vercel.json` is maintained as a fallback serverless target).

---

## Security Policy

- **Global Guards**: `JwtAuthGuard` (JWT authentication) and `RolesGuard` (Role-based access control) are registered globally.
- **Bypassing Auth**: Public routes use the `@Public()` decorator.
- **Customer Auth**: Customers authenticate using the `@Public()` and `@UseGuards(SupabaseAuthGuard)` decorators sequentially to bypass JWT checks and authorize with their Supabase token.
