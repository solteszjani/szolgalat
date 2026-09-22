# DATE FIX 2

A korábbi dátumjavításban egy escape-hiba maradt a JavaScript dátum-regexben.
Ez most javítva lett: a frontend helyesen felismeri a `YYYY-MM-DD` PostgreSQL dátumot.

A telefonon a régi oldal/cache miatt is látható lehetett a korábbi állapot.
A GitHub frissítése és új Render deploy után a telefon böngészőjében is frissítsd az oldalt.
Ha a telefon továbbra is a régi verziót mutatja, töröld a webhely adatait/cache-ét, majd nyisd meg újra.
