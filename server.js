import express from "express";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";
import pg from "pg";
const { Pool } = pg;

const app=express();
const PORT=process.env.PORT||3000;
const __filename=fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);
app.use(cors()); app.use(express.json());
let pool;
function db(){
  if(!process.env.DATABASE_URL) throw new Error("DATABASE_URL nincs beállítva.");
  if(!pool) pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}});
  return pool;
}
async function init(){await db().query(`CREATE TABLE IF NOT EXISTS users(id SERIAL PRIMARY KEY,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,created_at TIMESTAMPTZ DEFAULT NOW()); CREATE TABLE IF NOT EXISTS shifts(id SERIAL PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,date DATE NOT NULL,start_time TEXT NOT NULL,end_time TEXT NOT NULL,type TEXT NOT NULL,location TEXT DEFAULT '',note TEXT DEFAULT '',created_at TIMESTAMPTZ DEFAULT NOW(),updated_at TIMESTAMPTZ DEFAULT NOW()); CREATE INDEX IF NOT EXISTS shifts_user_date_idx ON shifts(user_id,date);`)}
app.get("/health",(req,res)=>res.json({ok:true,service:"szolgalat-naptar"}));
app.use(express.static(path.join(__dirname,"dist")));
app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"dist","index.html")));
if(process.env.VERCEL) { /* Vercel uses api/*.js handlers. */ }
else init().then(()=>app.listen(PORT,()=>console.log(`Server listening on ${PORT}`))).catch(e=>{console.error(e);process.exit(1)});
export default app;
