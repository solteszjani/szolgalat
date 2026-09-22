# Dátumkezelési javítás

Javítva lett a szolgálatok dátumkezelése.

A PostgreSQL `DATE` mezőt a backend most mindig `YYYY-MM-DD` formában küldi vissza,
a frontend pedig az esetleges ISO timestamp formátumot is felismeri.

Ez javítja:
- a naptárban a szolgálati nap jelölését,
- a kiválasztott napi szolgálatok megjelenését,
- a „Következő szolgálat” kártya `Invalid Date` hibáját,
- a havi statisztikát.
