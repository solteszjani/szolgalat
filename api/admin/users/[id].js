import { readyDb } from "../../_lib/db.js";
import { requireAdmin, ADMIN_USERNAME, ADMIN_EMAIL } from "../../_lib/auth.js";
export default async function handler(req,res){
  try{
    const db=await readyDb(); const admin=await requireAdmin(req,res,db); if(!admin)return;
    if(req.method!=="DELETE") return res.status(405).json({error:"Method not allowed"});
    const id=String(req.query.id);
    const r=await db.query("SELECT id,username,email FROM users WHERE id=$1",[id]);
    if(!r.rowCount)return res.status(404).json({error:"Felhasználó nem található."});
    const target=r.rows[0];
    if(String(target.username||"").toLowerCase()===ADMIN_USERNAME.toLowerCase()||String(target.email||"").toLowerCase()===ADMIN_EMAIL.toLowerCase()) return res.status(400).json({error:"A fő adminisztrátor nem törölhető."});
    await db.query("DELETE FROM users WHERE id=$1",[id]);
    res.json({ok:true});
  }catch(e){console.error("admin user",e);res.status(500).json({error:e.message||"Admin hiba"});}
}
