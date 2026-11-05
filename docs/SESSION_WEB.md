# Rester connecté sur le web

La case **Rester connecté sur cet appareil** est rétablie à la demande du responsable. Elle est décochée par défaut. Sur web, elle propose une durée fixe de **7 jours** ; le comportement natif dans SecureStore est conservé.

## Comportement

- **Décochée** : connexion temporaire. Le jeton et l’identité restent en mémoire ; un rechargement redemande les identifiants. Une mémorisation précédente est supprimée lors de cette nouvelle connexion.
- **Cochée** : le serveur crée un cookie opaque chiffré et authentifié. Au rechargement ou dans un nouvel onglet, le serveur retrouve les identifiants et demande un nouveau jeton à ISEN. Le jeton retourné reste en mémoire du client. Une expiration API peut déclencher une seule reprise mutualisée, avec au plus une nouvelle tentative de la requête personnelle.
- **Déconnexion / démo** : suppression du cookie et des données personnelles locales. Si le réseau est coupé, un marqueur non secret `cnisen:logout-pending` interdit toute restauration et fait réessayer la suppression avant une future reprise. Il est volontairement distinct du préfixe des caches, pour survivre à leur effacement. Si le stockage est également bloqué et que la suppression réseau échoue, la déconnexion ne prétend pas avoir réussi et affiche une erreur.
- **Expiration / mot de passe changé** : retour au formulaire, cookie supprimé. Une panne amont temporaire conserve le cookie pour permettre de réessayer. Les 7 jours ne sont pas prolongés par une visite.

## Mécanisme réel et limites

Le contrat actuel utilise `/v1/token` avec identifiant et mot de passe, sans refresh token documenté dans le projet. Pour rétablir une connexion après expiration sans base de données supplémentaire, `/api/session` scelle les identifiants avec **AES-256-GCM**, IV aléatoire, tag d’authentification et expiration authentifiée. La clé de 32 octets appartient exclusivement au serveur. Le cookie contient donc des identifiants **chiffrés**, pas uniquement un identifiant de session en base. Le navigateur détient ce texte chiffré ; le JavaScript de l’application n’y a pas accès. Aucun mot de passe n’est persisté en clair ni dans localStorage. Les identifiants restent brièvement en mémoire lors de leur saisie et de leur traitement serveur.

En HTTPS : cookie `__Secure-cnisen_remember`, **HttpOnly, Secure, SameSite=Strict**, sans Domain et avec **Path=/api/session**. Ce chemin empêche l’envoi du cookie au proxy externe `/api-proxy` et aux calendriers. Sur le serveur local HTTP lié à la boucle locale uniquement, le cookie n’a pas Secure et utilise un autre nom ; ce mode ne dépend pas d’un contournement TLS. Les réponses sont `private, no-store`.

Une clé serveur compromise permettrait de déchiffrer des cookies récupérés : elle doit rester secrète, indépendante des secrets du client et absente de Git. Sans stockage central, la déconnexion efface la mémorisation de ce navigateur ; elle ne prétend pas révoquer une copie volée du cookie ni des jetons ISEN déjà émis. L’expiration fixe et la rotation de clé limitent/invalident la mémorisation. Une révocation individuelle à distance exigerait un registre serveur ou une capacité amont supplémentaire.

## Configuration

**Local :** `npm run web` ou `npm run preview` appelle `scripts/setup-session.cjs`. Une clé aléatoire est créée une seule fois dans `.env.local`, ignoré par Git ; les lancements suivants réutilisent cette clé. Node 22.12+ est requis comme pour le projet. Le fichier `.env.example` décrit uniquement le nom de la variable, sans secret.

**Vercel :** ajouter `SESSION_ENCRYPTION_KEY`, contenant 64 caractères hexadécimaux aléatoires (32 octets), aux environnements Production et Preview concernés, puis redéployer. Générer une clé dédiée avec `openssl rand -hex 32`. Ne pas employer `EXPO_PUBLIC_`, committer la valeur ou réutiliser la clé locale. La connexion temporaire fonctionne sans cette clé ; la case cochée renvoie une erreur explicite 503 si elle manque. Changer la clé invalide les cookies de mémorisation existants.

## Fichiers et validation

- `api/session.js` : GET/POST/DELETE, chiffrement serveur, durée, validation de corps et d’origine, en-tête privé obligatoire, aucune ouverture CORS, délais 15 secondes et réponse token limitée à 16 000 octets. Aucune tentative récursive ni journal de secrets.
- `services/webSession.ts` : choix envoyé au serveur, restauration mutualisée, sérialisation des connexions/déconnexions, marqueur de déconnexion hors ligne.
- `services/isenApi.ts` : reconnexion web via le cookie, refus d’utiliser une identité différente pour les données du compte courant, stratégie native inchangée.
- `AppData.tsx`, formulaire et réglages : restauration avant chargement des caches par compte ; réponses tardives écartées ; case HTML native sur web pour Espace et l’état coché accessible, contrôle React Native sur appareil.

La suite compte **74 tests réussis** : 20 ajouts couvrent chiffrement, attributs et portée du cookie, reprise, expiration, altération, rotation de clé, option décochée, déconnexion, configuration absente, origine, entrées et réponses trop grandes, délais, 401 bornés, identité différente, concurrence et restauration tardive. Les réponses amont et comptes sont fictifs.

TypeScript, lint, export web et bundles Android/iOS passent. Le contrôle navigateur utilise un serveur de test séparé et un compte fictif ; aucun identifiant réel n’est saisi ou capturé. Reprise après rechargement et nouvel onglet, suppression après déconnexion, absence de reprise avec l’option décochée et activation au clavier Espace vérifiées en navigateur. La validation après déploiement Vercel avec la clé configurée et un compte ISEN réel reste à réaliser. Le bundling natif ne remplace pas un essai sur appareil.

Références de mise en œuvre : [crypto Node.js](https://nodejs.org/api/crypto.html), [cookies Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie), [fonctions Node.js Vercel](https://vercel.com/docs/functions/runtimes/node-js) et [variables d’environnement Vercel](https://vercel.com/docs/environment-variables).
