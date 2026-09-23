# Tabló fehér oldal javítása

A Tabló komponens a `cfg.service_types` értéket használta, de a `cfg` állapot nem volt deklarálva a komponensen belül. Ez React futásidejű hibát okozott, ezért a Tabló megnyitásakor fehér oldal jelent meg.

Javítás:
- `cfg` állapot hozzáadva a Tabló komponenshez.
- A `/api/settings` betöltése hozzáadva.
- Alapértelmezett szolgálattípusok használata akkor is, ha a beállítás API nem érhető el.
- Az `api/health.js` eltávolítva a Vercel Serverless Function darabszámának csökkentésére.
