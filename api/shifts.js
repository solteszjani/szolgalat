import { readyDb } from "./_lib/db.js";
import { requireAuth } from "./_lib/auth.js";

export default async function handler(req,res){
  const user=requireAuth(req,res); if(!user)return;
  try{
    const db=await readyDb();
    if(req.method==="GET"){
      const r=await db.query("SELECT id,TO_CHAR(date,'YYYY-MM-DD') AS date,start_time AS start,end_time AS end,type,location,note FROM shifts WHERE user_id=$1 ORDER BY date,start_time",[user.id]);
      return res.status(200).json(r.rows.map(x=>({...x,id:String(x.id),date:String(x.date)})));
    }
    if(req.method==="POST"){
      const {date,start,end,type,location="",note=""}=req.body||{};
      if(!date||!start||!end||!type)return res.status(400).json({error:"Hiányzó kötelező adat"});
      const r=await db.query("INSERT INTO shifts(user_id,date,start_time,end_time,type,location,note) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id,TO_CHAR(date,'YYYY-MM-DD') AS date,start_time AS start,end_time AS end,type,location,note",[user.id,date,start,end,type,location,note]);
      const x=r.rows[0];return res.status(200).json({...x,id:String(x.id),date:String(x.date)});
    }
    return res.status(405).json({error:"Method not allowed"});
  }catch(e){console.error("shifts",e);res.status(500).json({error:e.message||"Adatbázis hiba"});}
}
