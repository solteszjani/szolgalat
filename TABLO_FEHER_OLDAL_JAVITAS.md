# Tabló fehér oldal – javítás

A Tabló adatbetöltése most csak tömböt fogad el, hibás API-válasz esetén nem omlik össze az oldal. A Tabló számításai védve vannak hiányzó dátum/idő adatok ellen, és az alkalmazás kapott egy React Error Boundary-t is, hogy egy váratlan kliensoldali hiba ne eredményezzen üres fehér oldalt.

A felesleges `api/index.js` entrypoint törölve lett, így Vercel Hobby csomagon a Serverless Function limit alatt marad a projekt.
