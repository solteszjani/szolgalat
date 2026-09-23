import { readyDb } from "../_lib/db.js";
import { requireAdmin } from "../_lib/auth.js";
export default async function handler(req,res){
  try{ const db=await readyDb(); if(!await requireAdmin(req,res,db)) return;
    if(req.method==="GET"){ const r=await db.query("SELECT key,value FROM system_settings ORDER BY key"); const o={}; for(const x of r.rows)o[x.key]=x.value; o.service_types=(o.service_types||"").split("|").filter(Boolean); o.call_signs=(o.call_signs||"").split("|").filter(Boolean); o.retention_days=Number(o.retention_days||90); return res.json(o); }
    if(req.method==="PUT"){ const b=req.body||{}; const appName=String(b.app_name||"Szolgálat Naptár").trim().slice(0,80); const retention=Math.max(1,Math.min(3650,Number(b.retention_days)||90)); const types=Array.isArray(b.service_types)?b.service_types.map(String).map(x=>x.trim()).filter(Boolean).slice(0,30):[]; const calls=Array.isArray(b.call_signs)?b.call_signs.map(String).map(x=>x.trim()).filter(Boolean).slice(0,100):[]; const vals={app_name:appName,retention_days:String(retention),service_types:types.join("|"),call_signs:calls.join("|")}; for(const [k,v] of Object.entries(vals)) await db.query("INSERT INTO system_settings(key,value,updated_at) VALUES($1,$2,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()",[k,v]); await db.query("DELETE FROM shifts WHERE date < CURRENT_DATE - ($1 * INTERVAL '1 day')",[retention]); return res.json({ok:true,app_name:appName,retention_days:retention,service_types:types,call_signs:calls}); }
    return res.status(405).json({error:"Method not allowed"});
  }catch(e){console.error("admin settings",e);res.status(500).json({error:e.message||"Beállítási hiba"})}
}
