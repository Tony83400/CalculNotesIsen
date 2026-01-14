// api/calendar.js
export default async function handler(request, response) {
  // L'URL secrète de l'ISEN
  const ICS_URL = 'https://ent.isen-mediterranee.fr/webaurion/ICS/anthony.coulais.ics';

  // 1. GESTION CORS (Obligatoire pour que ton site ait le droit de lire)
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*'); // '*' = tout le monde
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Si le navigateur demande juste "Est-ce que j'ai le droit ?", on dit OUI tout de suite.
  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  try {
    // 2. APPEL ISEN
    const fetchResponse = await fetch(ICS_URL);
    
    if (!fetchResponse.ok) {
      throw new Error(`Erreur ISEN: ${fetchResponse.status}`);
    }

    const icsData = await fetchResponse.text();

    // 3. RÉPONSE OPTIMISÉE
    response.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    // Cache : Garde en mémoire 15 min (900s) pour ne pas spammer l'ISEN
    response.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=60');
    
    response.status(200).send(icsData);

  } catch (error) {
    console.error("Erreur Proxy:", error);
    response.status(500).json({ error: 'Impossible de récupérer le planning' });
  }
}