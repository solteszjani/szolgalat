# Szolgálat Naptár – Render Web App

Ez a projekt React + Vite frontendből és Express + PostgreSQL backendből áll.
Renderen **Web Service-ként** kell futtatni.

## Funkciók

- e-mail + jelszó regisztráció
- bejelentkezés JWT munkamenettel
- PostgreSQL online adatbázis
- szolgálat létrehozása, szerkesztése és törlése
- felhasználónként elkülönített szolgálatok
- automatikus online szinkronizáció
- reszponzív mobilnézet
- PWA telepíthetőség telefonra
- sötét/világos mód

## Render telepítés

### 1. GitHub

Töltsd fel a projekt teljes tartalmát egy GitHub repositoryba.

### 2. Render Web Service

Renderben:

1. **New → Web Service**
2. Válaszd ki a GitHub repositoryt.
3. Runtime: **Node**
4. Build Command:
   `npm install && npm run build`
5. Start Command:
   `npm start`

A repositoryban lévő `render.yaml` ugyanezeket a beállításokat tartalmazza.

### 3. PostgreSQL

Hozz létre egy Render PostgreSQL adatbázist.

A Web Service → **Environment** alatt add hozzá:

`DATABASE_URL` = a PostgreSQL **Internal Database URL** értéke.

A `JWT_SECRET` változót a `render.yaml` automatikusan generálja. Ha kézzel hozod létre a service-t, adj meg egy hosszú, véletlenszerű titkot.

### 4. Indulás

A szerver induláskor automatikusan létrehozza:

- `users`
- `shifts`

táblákat és a szükséges indexet.

Health check:

`/health`

Ha ezt megnyitod a Render URL végén, `{"ok":true}` választ kell kapnod.

## Fontos

A korábbi telepítési leírásban Static Site szerepelt. Ez **nem megfelelő**, mert az alkalmazásnak Node/Express backendje és PostgreSQL kapcsolata is van.

Helyesen:

**Render Web Service + Render PostgreSQL**

## Telefon / PWA

A Render által adott HTTPS címet nyisd meg telefonon.

iPhone:
Safari → Megosztás → **Főképernyőhöz adás**

Android:
Chrome → menü → **Telepítés / Hozzáadás a kezdőképernyőhöz**

