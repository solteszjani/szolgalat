import bcrypt from "bcryptjs";
import { readyDb } from "../_lib/db.js";
import { makeToken } from "../_lib/auth.js";
export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
  try{
    const {email="",password=""}=req.body||{};
    const clean=String(email).trim().toLowerCase();
    if(!clean||!clean.includes("@")||String(password).length<6) return res.status(400).json({error:"Érvényes e-mail és legalább 6 karakteres jelszó szükséges."});
    const db=await readyDb();
    const exists=await db.query("SELECT id FROM users WHERE email=$1",[clean]);
    if(exists.rowCount) return res.status(409).json({error:"Ez az e-mail már regisztrálva van."});
    const hash=await bcrypt.hash(String(password),12);
    const r=await db.query("INSERT INTO users(email,password_hash) VALUES($1,$2) RETURNING id,email",[clean,hash]);
    res.status(200).json({token:makeToken(r.rows[0]),user:r.rows[0]});
  }catch(e){console.error("register",e);res.status(500).json({error:e.message||"Szerverhiba"});}
}
