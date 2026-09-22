import bcrypt from "bcryptjs";
import { readyDb } from "../_lib/db.js";
import { makeToken } from "../_lib/auth.js";
export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
  try{
    const {username="",password=""}=req.body||{};
    const clean=String(username).trim();
    const db=await readyDb();
    const r=await db.query("SELECT id,username,password_hash FROM users WHERE LOWER(username)=LOWER($1) OR LOWER(email)=LOWER($1) LIMIT 1",[clean]);
    if(!r.rowCount||!(await bcrypt.compare(String(password),r.rows[0].password_hash))) return res.status(401).json({error:"Hibás felhasználónév vagy jelszó."});
    res.status(200).json({token:makeToken(r.rows[0]),user:{id:r.rows[0].id,username:r.rows[0].username}});
  }catch(e){console.error("login",e);res.status(500).json({error:e.message||"Szerverhiba"});}
}
