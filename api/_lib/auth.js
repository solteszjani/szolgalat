import jwt from "jsonwebtoken";

const secret = () => process.env.JWT_SECRET || "CHANGE_THIS_SECRET_BEFORE_PRODUCTION";

export function makeToken(user) {
  return jwt.sign({ id: user.id, username: user.username || user.email || "" }, secret(), { expiresIn: "30d" });
}

export function requireAuth(req, res) {
  const h = req.headers.authorization || "";
  if (!h.startsWith("Bearer ")) {
    res.status(401).json({ error: "Bejelentkezés szükséges" });
    return null;
  }
  try {
    return jwt.verify(h.slice(7), secret());
  } catch {
    res.status(401).json({ error: "Érvénytelen vagy lejárt munkamenet" });
    return null;
  }
}
