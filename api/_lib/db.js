import pg from "pg";
const { Pool } = pg;
let pool;
let initPromise;
export function getPool(){
  if(!process.env.DATABASE_URL) throw new Error("DATABASE_URL nincs beállítva.");
  if(!pool) pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false},max:5});
  return pool;
}
export async function ensureDb(){
  if(!initPromise){
    initPromise=(async()=>{
      const db=getPool();
      await db.query(`
        CREATE TABLE IF NOT EXISTS users(
          id SERIAL PRIMARY KEY,
          email TEXT UNIQUE,
          username TEXT UNIQUE,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
        ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
        WITH ranked AS (
          SELECT id, split_part(email,'@',1) AS base, ROW_NUMBER() OVER (PARTITION BY split_part(email,'@',1) ORDER BY id) AS rn
          FROM users WHERE (username IS NULL OR username='') AND email IS NOT NULL
        )
        UPDATE users u SET username = CASE WHEN r.rn=1 THEN r.base ELSE r.base || '_' || u.id END
        FROM ranked r WHERE u.id=r.id;
        CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique_idx ON users(username) WHERE username IS NOT NULL;
        CREATE TABLE IF NOT EXISTS shifts(
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          date DATE NOT NULL,
          start_time TEXT NOT NULL,
          end_time TEXT NOT NULL,
          type TEXT NOT NULL,
          location TEXT DEFAULT '',
          note TEXT DEFAULT '',
          call_sign TEXT DEFAULT '',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        ALTER TABLE shifts ADD COLUMN IF NOT EXISTS call_sign TEXT DEFAULT '';
        ALTER TABLE shifts ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'service';
        ALTER TABLE shifts ADD COLUMN IF NOT EXISTS parent_shift_id INTEGER REFERENCES shifts(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS shifts_parent_idx ON shifts(parent_shift_id);
        UPDATE shifts SET type='Járőr szolgálat' WHERE type='Járőrszolgálat';
        CREATE INDEX IF NOT EXISTS shifts_user_date_idx ON shifts(user_id,date);
        CREATE INDEX IF NOT EXISTS shifts_call_sign_date_idx ON shifts(call_sign,date);
      `);
      await db.query(`DELETE FROM shifts WHERE date < CURRENT_DATE - INTERVAL '90 days'`);
      return true;
    })().catch(err=>{initPromise=undefined;throw err});
  }
  return initPromise;
}
export async function readyDb(){await ensureDb();return getPool()}
