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
      let {date,start='00:00',end='00:00',type,kind='service',parent_shift_id=null,call_sign="",location="",note=""}=req.body||{};
      if(!date||!type)return res.status(400).json({error:"Hiányzó kötelező adat"});
      if(!['service','vacation','sick','overtime'].includes(kind))return res.status(400).json({error:"Érvénytelen bejegyzéstípus"});
      if(kind==='vacation'){type='Szabadság';}
      if(kind==='overtime' && parent_shift_id){
        const parent=await db.query("SELECT id,TO_CHAR(date,'YYYY-MM-DD') AS date,start_time,end_time FROM shifts WHERE id=$1 AND user_id=$2 AND kind='service'",[parent_shift_id,user.id]);
        if(!parent.rowCount)return res.status(400).json({error:"A kapcsolódó szolgálat nem található"});
        start=parent.rows[0].end_time;
        const overnight=String(parent.rows[0].end_time)<=String(parent.rows[0].start_time);
        const baseDate=new Date(String(parent.rows[0].date)+"T00:00:00Z");
        if(overnight)baseDate.setUTCDate(baseDate.getUTCDate()+1);
        date=baseDate.toISOString().slice(0,10);
      }
      const r=await db.query("UPDATE shifts SET date=$1,start_time=$2,end_time=$3,type=$4,kind=$5,parent_shift_id=$6,call_sign=$7,location=$8,note=$9,updated_at=NOW() WHERE id=$10 AND user_id=$11 RETURNING id,TO_CHAR(date,'YYYY-MM-DD') AS date,start_time AS start,end_time AS end,type,kind,parent_shift_id,call_sign,location,note",[date,start,end,type,kind,parent_shift_id,call_sign,location,note,id,user.id]);
      if(!r.rowCount)return res.status(404).json({error:"A szolgálat nem található"});
      const x=r.rows[0];return res.status(200).json({...x,id:String(x.id),date:String(x.date)});
    }
    return res.status(405).json({error:"Method not allowed"});
  }catch(e){console.error("shift id",e);res.status(500).json({error:e.message||"Adatbázis hiba"});}
}
