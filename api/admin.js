import { readyDb } from "./_lib/db.js";
import { requireAdmin } from "./_lib/auth.js";
export default async function handler(req,res){
  try{
    const db=await readyDb(); const admin=await requireAdmin(req,res,db); if(!admin)return;
    if(req.method!=="GET") return res.status(405).json({error:"Method not allowed"});
    const users=await db.query(`SELECT u.id,u.username,u.email,u.created_at,
      COUNT(s.id) FILTER (WHERE s.kind='service')::int AS service_count,
      COUNT(s.id) FILTER (WHERE s.kind='vacation')::int AS vacation_count,
      COUNT(s.id) FILTER (WHERE s.kind='overtime')::int AS overtime_count,
      COALESCE(SUM(CASE WHEN s.kind IN ('service','overtime') THEN CASE WHEN s.end_time::time >= s.start_time::time THEN EXTRACT(EPOCH FROM (s.end_time::time-s.start_time::time))/3600 ELSE EXTRACT(EPOCH FROM ((s.end_time::time + interval '24 hours')-s.start_time::time))/3600 END ELSE 0 END),0)::float AS hours
      FROM users u LEFT JOIN shifts s ON s.user_id=u.id GROUP BY u.id ORDER BY u.username`);
    res.json({admin:{id:admin.id,username:admin.username,email:admin.email||""},users:users.rows});
  }catch(e){console.error("admin",e);if(!res.headersSent)res.status(500).json({error:e.message||"Admin hiba"});}
}
