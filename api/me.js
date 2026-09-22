import { readyDb } from "./_lib/db.js";
import { requireAuth } from "./_lib/auth.js";
export default async function handler(req,res){
  const user=requireAuth(req,res); if(!user)return;
  try{await readyDb();res.status(200).json({id:user.id,email:user.email});}catch(e){res.status(500).json({error:e.message||"Szerverhiba"});}
}
