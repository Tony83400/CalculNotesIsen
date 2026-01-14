const https = require('https');

module.exports = (req, res) => {
  // 1. RÉCUPÉRATION DES PARAMÈTRES
  // L'URL ressemblera à : /api/calendar?prenom=john&nom=smith
  const { prenom, nom } = req.query;

  // Sécurité : Si pas de nom ou prénom, on arrête tout
  if (!prenom || !nom) {
    return res.status(400).json({ 
      error: "Paramètres manquants", 
      message: "Utilisez l'URL sous la forme : /api/calendar?prenom=votrePrenom&nom=votreNom" 
    });
  }

  // 2. CONSTRUCTION DE L'URL DYNAMIQUE
  // On met tout en minuscule (toLowerCase) car les fichiers ISEN sont souvent en minuscule
  // On "encode" pour gérer les espaces ou accents éventuels
  const safePrenom = encodeURIComponent(prenom.toLowerCase());
  const safeNom = encodeURIComponent(nom.toLowerCase());
  
  const ICS_URL = `https://ent.isen-mediterranee.fr/webaurion/ICS/${safePrenom}.${safeNom}.ics`;

  console.log("Cible :", ICS_URL); // Utile pour les logs Vercel

  // 3. HEADERS CORS (Rien ne change ici)
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

  // 4. Options HTTPS (Mode "Bulldozer")
  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/calendar, text/plain, */*'
    },
    rejectUnauthorized: false // On ignore les erreurs SSL
  };

  // 5. La requête vers l'ISEN
  https.get(ICS_URL, options, (externalRes) => {
    
    // Si l'utilisateur n'existe pas, l'ISEN renverra probablement une 404
    if (externalRes.statusCode !== 200) {
      return res.status(404).json({ 
        error: "Introuvable",
        details: `Impossible de trouver l'agenda pour ${safePrenom}.${safeNom} (Code ISEN: ${externalRes.statusCode})`
      });
    }

    let data = '';

    externalRes.on('data', (chunk) => {
      data += chunk;
    });

    externalRes.on('end', () => {
      // On renvoie le fichier
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${safePrenom}-${safeNom}.ics"`);
      res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=60');
      res.status(200).send(data);
    });

  }).on('error', (err) => {
    console.error("ERREUR:", err);
    res.status(500).json({ error: 'Erreur de connexion', details: err.message });
  });
};