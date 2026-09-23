import jwt from "jsonwebtoken";

const secret = () => process.env.JWT_SECRET || "CHANGE_THIS_SECRET_BEFORE_PRODUCTION";
export const ADMIN_USERNAME = "solteszjanos14";
export const ADMIN_EMAIL = "solteszjanos14@gmail.com";

export function makeToken(user) {
  return jwt.sign({ id: user.id, username: user.username || user.email || "", email: user.email || "" }, secret(), { expiresIn: "30d" });
}

export function requireAuth(req, res) {
  const h = req.headers.authorization || "";
  if (!h.startsWith("Bearer ")) { res.status(401).json({ error: "Bejelentkezés szükséges" }); return null; }
  try { return jwt.verify(h.slice(7), secret()); }
  catch { res.status(401).json({ error: "Érvénytelen vagy lejárt munkamenet" }); return null; }
}

export async function requireAdmin(req, res, db) {
  const user = requireAuth(req, res);
  if (!user) return null;
  const r = await db.query("SELECT id, username, email FROM users WHERE id=$1", [user.id]);
  if (!r.rowCount) { res.status(401).json({ error: "Felhasználó nem található" }); return null; }
  const row = r.rows[0];
  const admin = String(row.username || "").toLowerCase() === ADMIN_USERNAME.toLowerCase() || String(row.email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase();
  if (!admin) { res.status(403).json({ error: "Nincs adminisztrátori jogosultságod." }); return null; }
  return row;
}
