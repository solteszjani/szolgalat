
const express=require("express");
const path=require("path");
const cors=require("cors");
const bcrypt=require("bcryptjs");
const jwt=require("jsonwebtoken");
const {Pool}=require("pg");

const app=express();
const PORT=process.env.PORT||3000;
const JWT_SECRET=process.env.JWT_SECRET||"CHANGE_THIS_SECRET_IN_RENDER";
const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_URL?{rejectUnauthorized:false}:false});

app.use(cors());
app.use(express.json());

app.get("/health",(req,res)=>res.json({ok:true,service:"szolgalat-naptar"}));

let dbInitPromise=null;
async function init(){
 if(!process.env.DATABASE_URL) throw new Error("DATABASE_URL nincs beállítva. Vercel/Neon PostgreSQL kapcsolat szükséges.");
 await pool.query(`
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
}
function ensureDb(req,res,next){
 if(!dbInitPromise) dbInitPromise=init().catch(err=>{dbInitPromise=null; throw err;});
 dbInitPromise.then(()=>next()).catch(err=>{console.error("Database init error:",err);res.status(500).json({error:"Az adatbázis nem érhető el vagy még nincs inicializálva."});});
}

function tokenFor(user){return jwt.sign({id:user.id,email:user.email},JWT_SECRET,{expiresIn:"30d"});}
app.use("/api",ensureDb);

// Vercel/Neon setup and diagnostics endpoint. It creates the tables and reports
// connection status without exposing the database URL or credentials.
app.get("/api/setup", async (req,res)=>{
  try{
    await pool.query("SELECT 1");
    const tables=await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('users','shifts') ORDER BY table_name`);
    res.json({ok:true,database:true,tables:tables.rows.map(r=>r.table_name),message:"Az adatbázis elérhető és az alkalmazás táblái inicializálva vannak."});
  }catch(e){
    console.error("/api/setup error:",e);
    res.status(500).json({ok:false,database:false,error:String(e.message||e)});
  }
});
function auth(req,res,next){
 try{
   const h=req.headers.authorization||"";
   if(!h.startsWith("Bearer ")) return res.status(401).json({error:"Bejelentkezés szükséges"});
   req.user=jwt.verify(h.slice(7),JWT_SECRET);
   next();
 }catch(e){return res.status(401).json({error:"Érvénytelen vagy lejárt munkamenet"});}
}

app.post("/api/auth/register",async(req,res)=>{
 try{
   const email=String(req.body.email||"").trim().toLowerCase();
   const password=String(req.body.password||"");
   if(!email||!email.includes("@")||password.length<6)return res.status(400).json({error:"Érvényes e-mail és legalább 6 karakteres jelszó szükséges."});
   const exists=await pool.query("SELECT id FROM users WHERE email=$1",[email]);
   if(exists.rowCount)return res.status(409).json({error:"Ez az e-mail már regisztrálva van."});
   const hash=await bcrypt.hash(password,12);
   const r=await pool.query("INSERT INTO users(email,password_hash) VALUES($1,$2) RETURNING id,email",[email,hash]);
   res.json({token:tokenFor(r.rows[0]),user:r.rows[0]});
 }catch(e){console.error(e);res.status(500).json({error:"Szerverhiba"});}
});

app.post("/api/auth/login",async(req,res)=>{
 try{
   const email=String(req.body.email||"").trim().toLowerCase(),password=String(req.body.password||"");
   const r=await pool.query("SELECT id,email,password_hash FROM users WHERE email=$1",[email]);
   if(!r.rowCount||!(await bcrypt.compare(password,r.rows[0].password_hash)))return res.status(401).json({error:"Hibás e-mail vagy jelszó."});
   res.json({token:tokenFor(r.rows[0]),user:{id:r.rows[0].id,email:r.rows[0].email}});
 }catch(e){console.error(e);res.status(500).json({error:"Szerverhiba"});}
});

app.get("/api/me",auth,(req,res)=>res.json({id:req.user.id,email:req.user.email}));

app.get("/api/shifts",auth,async(req,res)=>{
 try{
   const r=await pool.query("SELECT id,TO_CHAR(date,'YYYY-MM-DD') AS date,start_time AS start,end_time AS end,type,location,note FROM shifts WHERE user_id=$1 ORDER BY date,start_time",[req.user.id]);
   res.json(r.rows.map(x=>({...x,date:String(x.date),id:String(x.id)})));
 }catch(e){console.error(e);res.status(500).json({error:"Nem sikerült betölteni a szolgálatokat"});}
});

app.post("/api/shifts",auth,async(req,res)=>{
 try{
   const {date,start,end,type,location="",note=""}=req.body;
   if(!date||!start||!end||!type)return res.status(400).json({error:"Hiányzó kötelező adat"});
   const r=await pool.query("INSERT INTO shifts(user_id,date,start_time,end_time,type,location,note) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id,TO_CHAR(date,'YYYY-MM-DD') AS date,start_time AS start,end_time AS end,type,location,note",[req.user.id,date,start,end,type,location,note]);
   const x=r.rows[0];res.json({...x,id:String(x.id),date:String(x.date)});
 }catch(e){console.error(e);res.status(500).json({error:"Nem sikerült menteni"});}
});

app.put("/api/shifts/:id",auth,async(req,res)=>{
 try{
   const {date,start,end,type,location="",note=""}=req.body;
   const r=await pool.query("UPDATE shifts SET date=$1,start_time=$2,end_time=$3,type=$4,location=$5,note=$6,updated_at=NOW() WHERE id=$7 AND user_id=$8 RETURNING id,TO_CHAR(date,'YYYY-MM-DD') AS date,start_time AS start,end_time AS end,type,location,note",[date,start,end,type,location,note,req.params.id,req.user.id]);
   if(!r.rowCount)return res.status(404).json({error:"A szolgálat nem található"});
   const x=r.rows[0];res.json({...x,id:String(x.id),date:String(x.date)});
 }catch(e){console.error(e);res.status(500).json({error:"Nem sikerült módosítani"});}
});

app.delete("/api/shifts/:id",auth,async(req,res)=>{
 try{
   await pool.query("DELETE FROM shifts WHERE id=$1 AND user_id=$2",[req.params.id,req.user.id]);
   res.json({ok:true});
 }catch(e){console.error(e);res.status(500).json({error:"Nem sikerült törölni"});}
});

const dist=path.join(__dirname,"dist");
app.use(express.static(dist));
app.get("*",(req,res)=>{
 if(req.path.startsWith("/api/"))return res.status(404).json({error:"API útvonal nem található"});
 res.sendFile(path.join(dist,"index.html"));
});

if(!process.env.VERCEL){
  init().then(()=>app.listen(PORT,()=>console.log("Server listening on "+PORT))).catch(e=>{console.error(e);process.exit(1)});
}

module.exports = app;
