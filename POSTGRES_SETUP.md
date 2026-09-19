# PostgreSQL & Authentication Setup Guide

## Prerequisites

You need PostgreSQL installed on your machine. Follow these steps:

### Windows Installation

1. **Download PostgreSQL 15+:**
   - Visit https://www.postgresql.org/download/windows/
   - Download the installer
   - Run the installer

2. **Installation Options:**
   - Choose default port: `5432`
   - Set password for `postgres` user: `postgres` (or change in .env)
   - Install pgAdmin (optional, useful for management)

3. **Verify Installation:**
   ```bash
   psql --version
   ```

### macOS Installation (via Homebrew)

```bash
brew install postgresql@15
brew services start postgresql@15
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

---

## Database Setup

### 1. Create Database

Connect to PostgreSQL:
```bash
psql -U postgres
```

Then create the database:
```sql
CREATE DATABASE seoscan;
\q
```

### 2. Update .env File

Make sure your `.env` file has the correct database URL:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/seoscan"
```

Replace:
- `postgres` (first) = your PostgreSQL username
- `postgres` (second) = your PostgreSQL password
- `5432` = PostgreSQL port (default)
- `seoscan` = database name

### 3. Run Database Migrations

```bash
npx prisma migrate dev --name init
```

This will:
- Create all tables (users, scans, white_label_settings)
- Generate Prisma client

### 4. Verify Setup

```bash
npx prisma studio
```

This opens a GUI to view your database. You should see three empty tables:
- `users`
- `scans`
- `white_label_settings`

---

## Environment Variables

Update `.env` with your values:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/seoscan"

# Gemini API (from Google AI Studio)
GEMINI_API_KEY="your-api-key-here"

# JWT (keep this secret!)
JWT_SECRET="your-super-secret-jwt-key-that-must-be-at-least-32-characters-long-for-security!"
JWT_EXPIRY="7d"

# App URL
APP_URL="http://localhost:3000"
```

---

## Running the App

```bash
npm run dev
```

The app will start on http://localhost:3000

---

## Authentication Endpoints

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"Your Name"}'
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "name": "Your Name"
  }
}
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

---

## Using the Token

All protected endpoints require the `Authorization` header:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/scans
```

---

## Troubleshooting

### "password authentication failed for user"
- Verify PostgreSQL is running
- Check username and password in .env

### "database does not exist"
- Create the database: `createdb seoscan -U postgres`

### "Prisma can't connect"
- Make sure PostgreSQL service is running
- Windows: Services > PostgreSQL > Start
- macOS: `brew services start postgresql@15`
- Linux: `sudo systemctl start postgresql`

### Port 5432 already in use
- Change the port in .env DATABASE_URL to an available port (e.g., 5433)

---

## Next Steps

1. Install PostgreSQL
2. Create the database
3. Update .env with your credentials
4. Run `npx prisma migrate dev --name init`
5. Start the app: `npm run dev`
6. Create your first user via the register endpoint
7. Frontend login/register UI is coming soon!
