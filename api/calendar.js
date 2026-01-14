// api/calendar.js

// On utilise la syntaxe standard Node.js (pas d'import/export default)
module.exports = async (request, response) => {
  const ICS_URL = 'https://ent.isen-mediterranee.fr/webaurion/ICS/anthony.coulais.ics';

  // 1. CORS (Sécurité)
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Gérer la requête de vérification du navigateur
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  try {
    // 2. Récupération du fichier
    // fetch est disponible globalement dans Node 18+ (utilisé par Vercel)
    const fetchResponse = await fetch(ICS_URL);
    
    if (!fetchResponse.ok) {
      throw new Error(`Erreur ISEN: ${fetchResponse.status}`);
    }

    const icsData = await fetchResponse.text();

    // 3. Réponse
    response.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    // Cache de 15 minutes
    response.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=60');
    
    return response.status(200).send(icsData);

  } catch (error) {
    console.error("LOG ERREUR:", error);
    return response.status(500).json({ 
      error: 'Erreur interne', 
      details: error.message 
    });
  }
};