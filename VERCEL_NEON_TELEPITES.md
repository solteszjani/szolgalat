# Vercel + Neon telepítés

1. GitHubra töltsd fel a projektet.
2. Vercel -> Add New -> Project -> Import GitHub repository.
3. Framework Preset: Vite (vagy Auto Detect).
4. Build Command: `npm run build`.
5. Output Directory: `dist`.
6. A projekt Environment Variables részében add meg:
   - `DATABASE_URL` = Neon pooled PostgreSQL connection string
   - `JWT_SECRET` = hosszú véletlen titok
7. Deploy.

A Vercel a szervert Express alkalmazásként kezeli. A frontend a `dist` könyvtárból szolgálódik ki, az `/api/*` útvonalakat az Express kezeli.

A Neon adatbázis Vercel Marketplace-ből is hozzákapcsolható.
