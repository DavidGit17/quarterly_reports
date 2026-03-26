# Quarterly Reports (Full-Stack Next.js)

This project now uses a real backend with Next.js API routes + MongoDB.

## Features

- Real signup/login with hashed passwords (`bcryptjs`)
- Cookie-based session authentication
- Role-based access (`coordinator` / `admin`)
- Report storage in MongoDB
- Coordinator-only report submission and own history
- Admin-only global dashboard and all reports access

## Tech Stack

- Next.js App Router
- Next.js Route Handlers (`app/api/*`)
- MongoDB Atlas
- TypeScript

## Environment Variables

Copy `.env.example` to `.env.local` and update values:

- `MONGODB_URI`
- `MONGODB_DB_NAME`

## Run Locally

```bash
npm install
npm run dev
```

## API Routes

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/reports` (coordinator only)
- `GET /api/reports` (admin only)
- `GET /api/my-reports` (coordinator only)
- `GET /api/reports/:id` (admin or owner)

## Notes

- UI layout/components are preserved; only logic/data flow has been replaced.
- Session is stored in a secure httpOnly cookie (`qr_session`).
