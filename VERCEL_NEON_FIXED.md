# Vercel + Neon FIX

A Neon konzolban a 0 tábla önmagában nem hiba: az alkalmazás hozza létre a `users` és `shifts` táblákat az első API kéréskor.

A korábbi verzióban Vercelen az adatbázis inicializálása nem volt megvárva a regisztráció előtt. Emiatt a regisztráció 500-as hibát kaphatott.

Ez a verzió:
- `/api/index.js` serverless belépési pontot használ Vercelhez;
- minden `/api/*` kérés előtt megvárja az adatbázis inicializálását;
- létrehozza a `users` és `shifts` táblákat, ha még nincsenek;
- a meglévő Neon adatbázist nem törli;
- a React/Vite frontend továbbra is a `dist` mappából épül.

Vercel Environment Variables:
- `DATABASE_URL` = Neon Connectből kimásolt PostgreSQL connection string
- `JWT_SECRET` = legalább 32-64 karakteres véletlen titok
