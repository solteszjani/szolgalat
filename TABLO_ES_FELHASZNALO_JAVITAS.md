# Tabló + felhasználónév frissítés

- Regisztrációkor már felhasználónév szükséges, e-mail cím nem.
- Bejelentkezés felhasználónévvel működik; a régi e-mailes felhasználókhoz kompatibilitás maradt.
- A régi `users.email` mezőt a migráció nem törli, de új felhasználónál már nem kötelező.
- A Tabló modern, 7 napos idővonalas táblázatot használ.
- Az éjszakába átnyúló szolgálatok vizuálisan ténylegesen átnyúlnak a következő nap oszlopába.
- A Tabló az elmúlt 90 nap és a jövőbeli szolgálatok adatait mutatja.
- A 90 napnál régebbi szolgálatokat az adatbázis inicializálásakor automatikusan törli a rendszer.
