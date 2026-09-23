import { readyDb } from "./_lib/db.js";
import { requireAuth } from "./_lib/auth.js";

export default async function handler(req,res){
  const user=requireAuth(req,res); if(!user)return;
  try{
    const db=await readyDb();
    if(req.method==="GET"){
      const r=await db.query("SELECT id,TO_CHAR(date,'YYYY-MM-DD') AS date,start_time AS start,end_time AS end,type,kind,parent_shift_id,call_sign,location,note FROM shifts WHERE user_id=$1 ORDER BY date,start_time",[user.id]);
      return res.status(200).json(r.rows.map(x=>({...x,id:String(x.id),date:String(x.date)})));
    }
    if(req.method==="POST"){
      let {date,start='00:00',end='00:00',type,kind='service',parent_shift_id=null,call_sign="",location="",note=""}=req.body||{};
      if(!date||!type)return res.status(400).json({error:"Hiányzó kötelező adat"});
      if(!['service','vacation','sick','overtime'].includes(kind))return res.status(400).json({error:"Érvénytelen bejegyzéstípus"});
      if(kind==='service' && (!start||!end))return res.status(400).json({error:"A szolgálat kezdése és befejezése kötelező"});
      if(kind==='overtime' && (!parent_shift_id||!end))return res.status(400).json({error:"A túlórához kapcsolódó szolgálat és befejezés kötelező"});
      if(kind==='vacation'){type='Szabadság';start='00:00';end='00:00';}
      if(kind==='sick'){type='Betegség';start='00:00';end='00:00';}
      if(kind==='overtime'){
        const parent=await db.query("SELECT id,TO_CHAR(date,'YYYY-MM-DD') AS date,start_time,end_time FROM shifts WHERE id=$1 AND user_id=$2 AND kind='service'",[parent_shift_id,user.id]);
        if(!parent.rowCount)return res.status(400).json({error:"A kapcsolódó szolgálat nem található"});
        start=parent.rows[0].end_time;
        const overnight=String(parent.rows[0].end_time)<=String(parent.rows[0].start_time);
        const baseDate=new Date(String(parent.rows[0].date)+"T00:00:00Z");
        if(overnight)baseDate.setUTCDate(baseDate.getUTCDate()+1);
        date=baseDate.toISOString().slice(0,10);
      }
      const r=await db.query("INSERT INTO shifts(user_id,date,start_time,end_time,type,kind,parent_shift_id,call_sign,location,note) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id,TO_CHAR(date,'YYYY-MM-DD') AS date,start_time AS start,end_time AS end,type,kind,parent_shift_id,call_sign,location,note",[user.id,date,start,end,type,kind,parent_shift_id,call_sign,location,note]);
      const x=r.rows[0];return res.status(200).json({...x,id:String(x.id),date:String(x.date)});
    }
    return res.status(405).json({error:"Method not allowed"});
  }catch(e){console.error("shifts",e);res.status(500).json({error:e.message||"Adatbázis hiba"});}
}
