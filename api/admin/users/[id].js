import { readyDb } from "../../_lib/db.js";
import { requireAdmin, ADMIN_USERNAME, ADMIN_EMAIL } from "../../_lib/auth.js";
import bcrypt from "bcryptjs";
const GROUPS=["Váltás I","Váltás II","Váltás III","Váltás IV","Nincs megadva"];
export default async function handler(req,res){
  try{
    const db=await readyDb(); const admin=await requireAdmin(req,res,db); if(!admin)return;
    const id=String(req.query.id);
    const r=await db.query("SELECT id,username,email,shift_group,created_at FROM users WHERE id=$1",[id]);
    if(!r.rowCount)return res.status(404).json({error:"Felhasználó nem található."});
    const target=r.rows[0];
    const protectedUser=String(target.username||"").toLowerCase()===ADMIN_USERNAME.toLowerCase()||String(target.email||"").toLowerCase()===ADMIN_EMAIL.toLowerCase();
    if(req.method==="DELETE"){
      if(protectedUser)return res.status(400).json({error:"A fő adminisztrátor nem törölhető."});
      await db.query("DELETE FROM users WHERE id=$1",[id]); return res.json({ok:true});
    }
    if(req.method==="PUT"){
      const b=req.body||{};
      const username=String(b.username??target.username).trim();
      const email=String(b.email??target.email??"").trim().toLowerCase()||null;
      const shift_group=GROUPS.includes(String(b.shift_group??target.shift_group??"Nincs megadva"))?String(b.shift_group??target.shift_group??"Nincs megadva"):"Nincs megadva";
      if(username.length<3)return res.status(400).json({error:"A felhasználónév legalább 3 karakter legyen."});
      if(!/^[A-Za-z0-9_.-]+$/.test(username))return res.status(400).json({error:"A felhasználónév csak betűt, számot, pontot, kötőjelet és aláhúzást tartalmazhat."});
      if(protectedUser && username.toLowerCase()!==ADMIN_USERNAME.toLowerCase() && (!email||email!==ADMIN_EMAIL))return res.status(400).json({error:"A fő admin azonosítója nem módosítható."});
      await db.query("UPDATE users SET username=$1,email=$2,shift_group=$3 WHERE id=$4",[username,email,shift_group,id]);
      if(b.password){ if(String(b.password).length<6)return res.status(400).json({error:"A jelszó legalább 6 karakter legyen."}); const hash=await bcrypt.hash(String(b.password),12); await db.query("UPDATE users SET password_hash=$1 WHERE id=$2",[hash,id]); }
      const out=await db.query("SELECT id,username,email,shift_group,created_at FROM users WHERE id=$1",[id]); return res.json(out.rows[0]);
    }
    return res.status(405).json({error:"Method not allowed"});
  }catch(e){console.error("admin user",e); if(e.code==="23505")return res.status(409).json({error:"A felhasználónév vagy e-mail már használatban van."}); res.status(500).json({error:e.message||"Admin hiba"});}
}
