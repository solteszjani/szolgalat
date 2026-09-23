import { readyDb } from "./_lib/db.js";
import { requireAuth, ADMIN_USERNAME, ADMIN_EMAIL } from "./_lib/auth.js";
export default async function handler(req,res){
  const user=requireAuth(req,res); if(!user)return;
  try{const db=await readyDb();const r=await db.query("SELECT id,username,email FROM users WHERE id=$1",[user.id]);if(!r.rowCount)return res.status(404).json({error:"Felhasználó nem található."});const x=r.rows[0];x.is_admin=String(x.username||"").toLowerCase()===ADMIN_USERNAME.toLowerCase()||String(x.email||"").toLowerCase()===ADMIN_EMAIL.toLowerCase();res.json(x);}
  catch(e){res.status(500).json({error:e.message||"Szerverhiba"});}
}
