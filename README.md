# Wundrsight Clinic Booking App

Appointment booking system for clinics, built with Next.js, Supabase, and Prisma.

---

## Tech Stack & Trade-offs

* **Next.js (App Router)**
  Powerful full-stack React framework.

  * Pros: Flexible, full-stack routing and SSR
  * Cons: App Router is newer, has occasional instability.

* **Prisma ORM**
  Type-safe and elegant database access.

  * Pros: Rapid development with type safety
  * Cons: Less control for raw SQL or high-performance queries

* **Supabase (PostgreSQL)**
  Managed PostgreSQL with built-in authentication.

  * Pros: Fast setup, integrated Auth, hosted
  * Cons: Vendor lock-in with Supabase infrastructure

* **Zod**
  Schema validation for inputs.

  * Pros: Integrates well with TypeScript
  * Cons: Verbose for complex object schemas

---

## How to Run Locally

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file based on `.env.example`:

```env
DATABASE_URL="your-supabase-postgres-connection-string"
JWT_SECRET="your-super-secret-jwt-key"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="Passw0rd!"
```

### 3. Migrate and Seed Database

```bash
npx prisma db push
npx prisma generate
npm run db:seed
```

### 4. Start the App

```bash
npm run dev
```

Visit: [http://localhost:3000](http://localhost:3000)

---

## Required Environment Variables

| Variable         | Description                                   |
| ---------------- | --------------------------------------------- |
| `DATABASE_URL`   | Supabase Postgres connection string           |
| `JWT_SECRET`     | Random string for signing JWTs                |
| `ADMIN_EMAIL`    | Email used to create the seeded admin account |
| `ADMIN_PASSWORD` | Password for the seeded admin account         |

---



---

## Known Limitations and 2-Hour Improvement Plan

| Limitation                    | Potential Improvements                                 |
| ----------------------------- | ------------------------------------------------------ |
| No cancellation functionality | Add cancellation endpoint and re-open slots            |
| Admin has no right to accept or reject          | Implement accept reject user functionality |
| Websockets/polling can be used for real time updates         | No real time updates    |
| No notifications              | Implement email reminders for upcoming appointments    |

---

# Architecture Notes

## Folder Structure Rationale

```
app/
  └── api/              # Backend endpoints
components/             # Reusable UI components
context/                # React Context (Auth)
lib/                    # Shared logic (auth, db, validation)
prisma/                 # DB schema & seed
.env                    # Environment config
```

* Logical separation of concerns: API logic in `app/api/`, UI components in `components/`, business logic in `lib/`

---

## Authentication and Role-Based Access Control (RBAC)

* JWT-based authentication, validated in API routes
* Two roles supported:

  * `PATIENT`: Can book and view own appointments
  * `ADMIN`: Can view all bookings (admin functionality can be extended further)

---

## Concurrency and Atomicity for Booking

* Database constraint on `slotId` ensures uniqueness, preventing double booking
* Bookings are created within a Prisma `$transaction()` to ensure atomicity

---

## Error Handling Strategy

* All input is validated using Zod
* API returns structured JSON errors with appropriate HTTP status codes
* Frontend handles and displays messages (can be enhanced with better UX feedback)

---

# Quick Verification (cURL)

### Register

```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"password123"}'
```

### Login

```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password123"}'
```

### Get Slots

```bash
curl "http://localhost:3000/api/slots?from=2025-08-07&to=2025-08-14" \
  -H "Authorization: Bearer <your_token>"
```

### Book a Slot

```bash
curl -X POST http://localhost:3000/api/book \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{"slotId":"<slot_id>"}'
```

### View My Bookings

```bash
curl http://localhost:3000/api/my-bookings \
  -H "Authorization: Bearer <your_token>"
```

### Admin - View All Bookings

```bash
curl http://localhost:3000/api/all-bookings \
  -H "Authorization: Bearer <admin_token>"
```



## Database Schema

```sql
-- users
id | name | email (unique) | password_hash | role ('PATIENT'|'ADMIN') | created_at

-- slots
id | start_at | end_at | created_at

-- bookings
id | user_id | slot_id (unique) | created_at
```


![Database Schema](/database-schema.png)

---

## Time Zone Handling

* All timestamps are stored in UTC
* Frontend converts times to the user's local time zone
* Slots are available from 09:00 to 17:00 (30-minute intervals, weekdays only)

---

## System Diagram


![System Design](/system-design.png)

---
