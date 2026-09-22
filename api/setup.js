import { readyDb } from "./_lib/db.js";
export default async function handler(req,res){
  try{
    const db=await readyDb();
    const tables=await db.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('users','shifts') ORDER BY table_name`);
    res.status(200).json({ok:true,database:true,tables:tables.rows.map(r=>r.table_name)});
  }catch(e){
    console.error("/api/setup",e);
    res.status(500).json({ok:false,database:false,error:e.message||String(e)});
  }
}
