import { readyDb } from "../_lib/db.js";
import { requireAuth } from "../_lib/auth.js";
export default async function handler(req,res){
  const user=requireAuth(req,res); if(!user)return;
  try{
    const db=await readyDb(); const id=req.query.id;
    if(req.method==="DELETE"){
      await db.query("DELETE FROM shifts WHERE id=$1 AND user_id=$2",[id,user.id]);
      return res.status(200).json({ok:true});
    }
    if(req.method==="PUT"){
      const {date,start,end,type,location="",note=""}=req.body||{};
      const r=await db.query("UPDATE shifts SET date=$1,start_time=$2,end_time=$3,type=$4,location=$5,note=$6,updated_at=NOW() WHERE id=$7 AND user_id=$8 RETURNING id,TO_CHAR(date,'YYYY-MM-DD') AS date,start_time AS start,end_time AS end,type,location,note",[date,start,end,type,location,note,id,user.id]);
      if(!r.rowCount)return res.status(404).json({error:"A szolgálat nem található"});
      const x=r.rows[0];return res.status(200).json({...x,id:String(x.id),date:String(x.date)});
    }
    return res.status(405).json({error:"Method not allowed"});
  }catch(e){console.error("shift id",e);res.status(500).json({error:e.message||"Adatbázis hiba"});}
}
