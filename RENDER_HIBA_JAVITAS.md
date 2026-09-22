# Render javítás

A Render hiba oka az volt, hogy a `package.json` `"type": "module"` beállítása miatt a CommonJS `require()` használatú `server.js` ES modulként indult.

A javított verzióban a `"type": "module"` beállítás el lett távolítva, így a meglévő `require()` szintaxis helyesen fut.

Render:
- Build: `npm install && npm run build`
- Start: `npm start`
