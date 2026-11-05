const https = require('node:https');
const {Buffer}=require('node:buffer');
const MAX_BYTES = 4 * 1024 * 1024;
// The upstream ICS service is public by name; this endpoint cannot impose ISEN
// authorization without a documented upstream identity/permission mechanism.
module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if(req.method === 'OPTIONS') {res.setHeader('Allow','GET, OPTIONS');return res.status(204).end();}
  if(req.method !== 'GET') {res.setHeader('Allow','GET, OPTIONS');return res.status(405).json({error:'Méthode non autorisée.'});}
  const {prenom, nom}=req.query;
  const valid=v=>typeof v==='string' && v.length>0 && v.length<=80 && /^[\p{L}\p{M}\p{N}' -]+$/u.test(v);
  if(!valid(prenom)||!valid(nom))return res.status(400).json({error:'Prénom et nom invalides.'});
  const clean=v=>encodeURIComponent(v.trim().toLowerCase().replace(/[\s']+/g,'-'));
  const url=`https://ent.isen-mediterranee.fr/webaurion/ICS/${clean(prenom)}.${clean(nom)}.ics`;
  let finished=false;
  const fail=(status,message)=>{if(finished)return;finished=true;res.status(status).json({error:message});};
  const upstream=https.get(url,{rejectUnauthorized:true,headers:{Accept:'text/calendar','User-Agent':'CalculNotesISEN/3'}},response=>{
    if(response.statusCode!==200){response.resume();return fail(response.statusCode===404?404:502,'Le calendrier amont est indisponible.');}
    const chunks=[];let size=0;
    response.on('data',chunk=>{size+=chunk.length;if(size>MAX_BYTES){fail(502,'Calendrier amont trop volumineux.');upstream.destroy();}else chunks.push(chunk);});
    response.on('error',()=>fail(502,'Lecture du calendrier interrompue.'));
    response.on('end',()=>{if(finished)return;const data=Buffer.concat(chunks).toString('utf8');if(!data.trimStart().startsWith('BEGIN:VCALENDAR'))return fail(502,'Format du calendrier amont invalide.');finished=true;res.setHeader('Content-Type','text/calendar; charset=utf-8');res.status(200).send(data);});
  });
  // Absolute deadline as well as idle timeout: a slowly trickling response must end.
  const deadline=setTimeout(()=>{fail(504,'Le calendrier amont ne répond pas.');upstream.destroy();},15000);
  upstream.setTimeout(10000,()=>{fail(504,'Le calendrier amont ne répond pas.');upstream.destroy();});
  upstream.on('error',()=>fail(502,'Connexion sécurisée au calendrier amont impossible.'));
  res.on('close',()=>{clearTimeout(deadline);if(!finished)upstream.destroy();});
  upstream.on('close',()=>clearTimeout(deadline));
};
