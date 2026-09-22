import bcrypt from "bcryptjs";
import { readyDb } from "../_lib/db.js";
import { makeToken } from "../_lib/auth.js";
export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
  try{
    const {email="",password=""}=req.body||{};
    const db=await readyDb();
    const r=await db.query("SELECT id,email,password_hash FROM users WHERE email=$1",[String(email).trim().toLowerCase()]);
    if(!r.rowCount||!(await bcrypt.compare(String(password),r.rows[0].password_hash))) return res.status(401).json({error:"Hibás e-mail vagy jelszó."});
    res.status(200).json({token:makeToken(r.rows[0]),user:{id:r.rows[0].id,email:r.rows[0].email}});
  }catch(e){console.error("login",e);res.status(500).json({error:e.message||"Szerverhiba"});}
}
