# Vercel + Neon diagnosztika

1. Vercel Environment Variables: DATABASE_URL és JWT_SECRET legyen Production alatt.
2. Mentsd a DATABASE_URL-t.
3. Indíts új deployt (az environment variable módosítása után új deploy szükséges).
4. Nyisd meg: /api/setup

Siker esetén JSON választ kapsz, benne `ok: true` és `tables: ["shifts", "users"]`.
Hiba esetén az endpoint kiírja a PostgreSQL hiba szövegét, jelszó nélkül.
