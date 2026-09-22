# Vercel + Neon javítás

A 404 oka: a korábbi Vercel konfiguráció nem irányította át az `/api/*`
útvonalakat az `api/index.js` serverless függvényhez.

A javított `vercel.json` ezt már tartalmazza:

`/api/:path*` -> `/api/index`

Telepítés:
1. Töltsd fel a teljes projektet GitHubra a meglévő repositoryba.
2. Vercelben indíts új deployt.
3. Ellenőrizd:
   `/api/setup`
4. Siker esetén:
   `{"ok":true,"database":true,"tables":["shifts","users"]}`

Vercel Environment Variables:
- DATABASE_URL = Neon Connect teljes PostgreSQL connection string
- JWT_SECRET = hosszú, véletlen titok

FONTOS: ha a DATABASE_URL jelszava korábban képernyőképen megjelent,
a Neonban cseréld le, majd az új connection stringet mentsd Vercelbe.
