import { readyDb } from "./_lib/db.js";
import { requireAuth } from "./_lib/auth.js";
export default async function handler(req,res){
  try{ const db=await readyDb(); if(!requireAuth(req,res)) return; const r=await db.query("SELECT key,value FROM system_settings ORDER BY key"); const o={}; for(const x of r.rows)o[x.key]=x.value; o.service_types=(o.service_types||"").split("|").filter(Boolean); o.call_signs=(o.call_signs||"").split("|").filter(Boolean); o.retention_days=Number(o.retention_days||90); res.json(o); }catch(e){res.status(500).json({error:e.message||"Beállítási hiba"})}
}
