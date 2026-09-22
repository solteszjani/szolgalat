import bcrypt from "bcryptjs";
import { readyDb } from "../_lib/db.js";
import { makeToken } from "../_lib/auth.js";
export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
  try{
    const {username="",password=""}=req.body||{};
    const clean=String(username).trim();
    if(!/^[A-Za-z0-9_.-]{3,30}$/.test(clean)||String(password).length<6)
      return res.status(400).json({error:"A felhasználónév 3–30 karakteres legyen (betű, szám, pont, kötőjel vagy aláhúzás), a jelszó legalább 6 karakter."});
    const db=await readyDb();
    const exists=await db.query("SELECT id FROM users WHERE LOWER(username)=LOWER($1)",[clean]);
    if(exists.rowCount) return res.status(409).json({error:"Ez a felhasználónév már foglalt."});
    const hash=await bcrypt.hash(String(password),12);
    const r=await db.query("INSERT INTO users(username,password_hash) VALUES($1,$2) RETURNING id,username",[clean,hash]);
    res.status(200).json({token:makeToken(r.rows[0]),user:r.rows[0]});
  }catch(e){console.error("register",e);res.status(500).json({error:e.message||"Szerverhiba"});}
}
