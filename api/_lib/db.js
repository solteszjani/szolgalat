import pg from "pg";
const { Pool } = pg;

let pool;
let initPromise;

export function getPool() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL nincs beállítva.");
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }
  return pool;
}

export async function ensureDb() {
  if (!initPromise) {
    initPromise = (async () => {
      const db = getPool();
      await db.query(`
        CREATE TABLE IF NOT EXISTS users(
          id SERIAL PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS shifts(
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          date DATE NOT NULL,
          start_time TEXT NOT NULL,
          end_time TEXT NOT NULL,
          type TEXT NOT NULL,
          location TEXT DEFAULT '',
          note TEXT DEFAULT '',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS shifts_user_date_idx ON shifts(user_id,date);
      `);
      return true;
    })().catch(err => {
      initPromise = undefined;
      throw err;
    });
  }
  return initPromise;
}

export async function readyDb() {
  await ensureDb();
  return getPool();
}
