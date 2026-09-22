# Vercel API javítás

A Vercelhez most valódi, külön serverless API fájlok tartoznak:

- `/api/setup`
- `/api/auth/register`
- `/api/auth/login`
- `/api/me`
- `/api/shifts`
- `/api/shifts/:id`

A `vercel.json` már nem használ catch-all rewrite-ot. A Vercel a fájlok alapján közvetlenül ezeket az útvonalakat szolgálja ki.

A `DATABASE_URL` és `JWT_SECRET` változókat Vercelben Production környezetben be kell állítani.
