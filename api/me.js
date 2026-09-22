import { readyDb } from "./_lib/db.js";
import { requireAuth } from "./_lib/auth.js";
export default async function handler(req,res){
  const user=requireAuth(req,res); if(!user)return;
  try{const db=await readyDb();const r=await db.query("SELECT id,username FROM users WHERE id=$1",[user.id]);if(!r.rowCount)return res.status(404).json({error:"Felhasználó nem található."});res.json(r.rows[0]);}
  catch(e){res.status(500).json({error:e.message||"Szerverhiba"});}
}
