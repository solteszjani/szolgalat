import { readyDb } from "./_lib/db.js";
import { requireAuth } from "./_lib/auth.js";
export default async function handler(req,res){
  const user=requireAuth(req,res); if(!user)return;
  if(req.method!=="GET") return res.status(405).json({error:"Method not allowed"});
  try{
    const db=await readyDb();
    const r=await db.query(`
      SELECT s.id,s.user_id,COALESCE(u.username,u.email,'Ismeretlen') AS username,
        TO_CHAR(s.date,'YYYY-MM-DD') AS date,s.start_time AS start,s.end_time AS end,
        s.type,s.kind,s.parent_shift_id,s.call_sign,s.location,s.note
      FROM shifts s JOIN users u ON u.id=s.user_id
      WHERE s.date >= CURRENT_DATE - INTERVAL '90 days'
      ORDER BY s.date ASC,s.start_time ASC,username ASC`);
    res.status(200).json(r.rows.map(x=>({...x,id:String(x.id),user_id:String(x.user_id),date:String(x.date)})));
  }catch(e){console.error("tablo",e);res.status(500).json({error:e.message||"Adatbázis hiba"});}
}
