const https = require('https');

module.exports = (req, res) => {
  const ICS_URL = 'https://ent.isen-mediterranee.fr/webaurion/ICS/anthony.coulais.ics';

  // 1. HEADERS CORS (Sécurité Navigateur)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. Options pour tromper le serveur ISEN
  const options = {
    headers: {
      // On se fait passer pour un Mac
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/calendar, text/plain, */*'
    },
    // IMPORTANT : On ignore les erreurs de certificat SSL (sécurité "lâche")
    rejectUnauthorized: false 
  };

  // 3. La requête "Old School" (Plus robuste que fetch pour ce cas)
  https.get(ICS_URL, options, (externalRes) => {
    
    if (externalRes.statusCode !== 200) {
      return res.status(500).json({ 
        error: `Erreur ISEN: Code ${externalRes.statusCode}`,
        details: "Le serveur a répondu mais pas avec le fichier."
      });
    }

    let data = '';

    // Réception des morceaux de données
    externalRes.on('data', (chunk) => {
      data += chunk;
    });

    // Fin du téléchargement
    externalRes.on('end', () => {
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=60');
      res.status(200).send(data);
    });

  }).on('error', (err) => {
    console.error("ERREUR CRITIQUE:", err);
    res.status(500).json({ 
      error: 'Échec de la connexion', 
      details: err.message 
    });
  });
};