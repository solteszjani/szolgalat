import { readyDb } from "../_lib/db.js";
import { requireAdmin } from "../_lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const started = Date.now();
  try {
    const db = await readyDb();
    const admin = await requireAdmin(req, res, db);
    if (!admin) return;

    const dbStarted = Date.now();
    const [
      users,
      shifts,
      kinds,
      shiftsByMonth,
      lastShift,
      settings,
      dbNow
    ] = await Promise.all([
      db.query(`SELECT COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE shift_group <> 'Nincs megadva')::int AS assigned,
        COUNT(*) FILTER (WHERE shift_group='Váltás I')::int AS v1,
        COUNT(*) FILTER (WHERE shift_group='Váltás II')::int AS v2,
        COUNT(*) FILTER (WHERE shift_group='Váltás III')::int AS v3,
        COUNT(*) FILTER (WHERE shift_group='Váltás IV')::int AS v4
        FROM users`),
      db.query(`SELECT COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE kind='service')::int AS service,
        COUNT(*) FILTER (WHERE kind='vacation')::int AS vacation,
        COUNT(*) FILTER (WHERE kind='sick')::int AS sick,
        COUNT(*) FILTER (WHERE kind='overtime')::int AS overtime
        FROM shifts`),
      db.query(`SELECT kind, COUNT(*)::int AS count FROM shifts GROUP BY kind ORDER BY kind`),
      db.query(`SELECT COUNT(*)::int AS count FROM shifts WHERE date >= date_trunc('month', CURRENT_DATE)`),
      db.query(`SELECT MAX(updated_at) AS updated_at FROM shifts`),
      db.query(`SELECT key,value,updated_at FROM system_settings ORDER BY key`),
      db.query(`SELECT NOW() AS now`)
    ]);
    const dbLatency = Date.now() - dbStarted;

    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.json({
      ok: true,
      checked_at: new Date().toISOString(),
      total_latency_ms: Date.now() - started,
      db_latency_ms: dbLatency,
      database: {
        status: "online",
        server_time: dbNow.rows[0]?.now || null
      },
      users: users.rows[0],
      shifts: shifts.rows[0],
      shifts_this_month: shiftsByMonth.rows[0]?.count || 0,
      last_shift_update: lastShift.rows[0]?.updated_at || null,
      kinds: kinds.rows,
      settings: settings.rows.reduce((a, r) => {
        a[r.key] = { value: r.value, updated_at: r.updated_at };
        return a;
      }, {}),
      runtime: {
        node: process.version,
        vercel: Boolean(process.env.VERCEL),
        region: process.env.VERCEL_REGION || "—"
      },
      application: {
        name: "Szolgálat Naptár",
        api: "online"
      }
    });
  } catch (e) {
    console.error("admin/status", e);
    if (!res.headersSent) res.status(500).json({ error: e.message || "Rendszerállapot hiba" });
  }
}
