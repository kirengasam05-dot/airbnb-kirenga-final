# Airbnb Kirenga API — Lessons 1 to 8

This is a complete Airbnb-style backend API built with **Node.js, Express, TypeScript, Prisma, PostgreSQL, JWT authentication, Cloudinary uploads, Swagger docs, and Lesson 8 AI features using LangChain + Groq**.

## What is included

- Express + TypeScript REST API
- PostgreSQL + Prisma models, relations, indexes and migrations
- Users, listings, listing photos, bookings and reviews
- JWT authentication and role-based access control: `ADMIN`, `HOST`, `GUEST`
- Password reset email flow with Nodemailer
- Avatar and listing photo uploads using Cloudinary, with local fallback
- Swagger/OpenAPI docs at `/api-docs`
- API versioning with `/api/v1` and `/api/v2`
- Pagination, filtering, search, booking conflict checking and statistics
- Production-ready Render deployment config
- **Lesson 8 AI endpoints using LangChain + Groq**

## Lesson 8 AI Assignment Features

### 1. Smart listing search with pagination

Endpoint:

```txt
POST /api/v1/ai/search?page=1&limit=5
```

Body:

```json
{
  "query": "I need an apartment in Kigali under 100 dollars for 2 guests with wifi"
}
```

The API uses AI to extract filters such as location, type, budget, guests and amenities, then queries Prisma with pagination.

### 2. AI listing description generator with tone control

Endpoint:

```txt
POST /api/v1/ai/descriptions
Authorization: Bearer HOST_TOKEN
```

Body:

```json
{
  "title": "Luxury Apartment Kigali",
  "location": "Kigali",
  "type": "APARTMENT",
  "amenities": ["wifi", "parking", "kitchen"],
  "tone": "luxury"
}
```

### 3. Guest support chatbot with listing context and memory

Endpoint:

```txt
POST /api/v1/ai/chat
```

Body:

```json
{
  "sessionId": "guest-session-1",
  "listingId": 1,
  "message": "Does this listing have wifi and parking?"
}
```

The chatbot remembers previous messages using an in-memory session map.

### 4. AI booking recommendation

Endpoint:

```txt
POST /api/v1/ai/recommendations
```

Body:

```json
{
  "location": "Kigali",
  "budget": 100,
  "guests": 2,
  "amenities": ["wifi"],
  "checkIn": "2026-07-01",
  "checkOut": "2026-07-04"
}
```

The API filters available listings and uses AI to explain why they are recommended.

### 5. Listing review summarizer

Endpoint:

```txt
GET /api/v1/ai/listings/1/review-summary
```

It summarizes all reviews for a listing and returns overall guest sentiment.

> If `GROQ_API_KEY` is missing, the project still works using safe fallback responses, so testing does not break.

## Requirements

- Node.js 18+
- PostgreSQL
- Optional: Cloudinary account for uploads
- Optional: Gmail app password for password reset emails
- Optional: Groq API key for AI responses

## Environment variables

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Example:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/airbnb_lesson8?schema=public"
JWT_SECRET="your_long_secret"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV="development"
API_URL="http://localhost:3000"

GROQ_API_KEY="your_groq_api_key"
GROQ_MODEL="llama-3.1-8b-instant"

EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-gmail-app-password"
EMAIL_FROM="Airbnb API <your-email@gmail.com>"

CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

## Setup

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Server:

```txt
http://localhost:3000
```

Swagger:

```txt
http://localhost:3000/api-docs
```

Health:

```txt
http://localhost:3000/health
```

## Seed accounts

All seeded passwords:

```txt
12345678
```

Admin:

```json
{
  "email": "admin@gmail.com",
  "password": "12345678"
}
```

Host:

```json
{
  "email": "host2@gmail.com",
  "password": "12345678"
}
```

Guest:

```json
{
  "email": "sam@gmail.com",
  "password": "12345678"
}
```

## Main API endpoints

### Auth

```txt
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/me
POST /api/v1/auth/change-password
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password/:token
```

### Users

```txt
GET    /api/v1/users
GET    /api/v1/users/me
GET    /api/v1/users/stats
GET    /api/v1/users/:id
PUT    /api/v1/users/:id
DELETE /api/v1/users/:id
POST   /api/v1/users/:id/avatar
DELETE /api/v1/users/:id/avatar
GET    /api/v1/users/:id/bookings
```

### Listings

```txt
GET    /api/v1/listings?page=1&limit=5
GET    /api/v1/listings?location=Kigali&type=APARTMENT&minPrice=10&maxPrice=100&guests=2
GET    /api/v1/listings/search?location=Kigali
GET    /api/v1/listings/stats
GET    /api/v1/listings/:id
POST   /api/v1/listings
PUT    /api/v1/listings/:id
DELETE /api/v1/listings/:id
POST   /api/v1/listings/:id/photos
DELETE /api/v1/listings/:id/photos/:photoId
```

### Bookings

```txt
GET    /api/v1/bookings
GET    /api/v1/bookings/me
GET    /api/v1/bookings/:id
POST   /api/v1/bookings
DELETE /api/v1/bookings/:id
PATCH  /api/v1/bookings/:id/cancel
PATCH  /api/v1/bookings/:id/status
```

### Reviews

```txt
POST   /api/v1/reviews
GET    /api/v1/reviews/listing/:listingId
PUT    /api/v1/reviews/:id
DELETE /api/v1/reviews/:id
GET    /api/v1/listings/:id/reviews
POST   /api/v1/listings/:id/reviews
```

### AI Lesson 8

```txt
POST /api/v1/ai/search
POST /api/v1/ai/descriptions
POST /api/v1/ai/chat
POST /api/v1/ai/recommendations
GET  /api/v1/ai/listings/:id/review-summary
```

## Postman testing flow

1. Register or login host.
2. Copy host token.
3. Create listing using host token.
4. Login guest.
5. Create booking using guest token.
6. Create review using guest token.
7. Test AI smart search.
8. Test AI description generator.
9. Test AI chatbot.
10. Test AI booking recommendation.
11. Test AI review summarizer.

## Render deployment

Build command:

```bash
npm install --include=dev && npx prisma generate && npm run build
```

Start command:

```bash
npx prisma migrate deploy && npm start
```

Environment variables on Render:

```env
DATABASE_URL=your_render_internal_database_url
JWT_SECRET=your_long_secret
JWT_EXPIRES_IN=7d
NODE_ENV=production
API_URL=https://your-app.onrender.com
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.1-8b-instant
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

## Production testing checklist

Replace `YOUR_URL` with your deployed URL:

```txt
GET  YOUR_URL/health
GET  YOUR_URL/api-docs
POST YOUR_URL/api/v1/auth/login
GET  YOUR_URL/api/v1/listings
POST YOUR_URL/api/v1/ai/search
POST YOUR_URL/api/v1/ai/descriptions
POST YOUR_URL/api/v1/ai/chat
POST YOUR_URL/api/v1/ai/recommendations
GET  YOUR_URL/api/v1/ai/listings/1/review-summary
```

## Important notes

- Never commit `.env`.
- Commit `prisma/migrations`.
- Use `npx prisma migrate deploy` in production.
- Use `/api/v1` for stable testing.
- Add `GROQ_API_KEY` for real AI results; fallback mode works without it.
