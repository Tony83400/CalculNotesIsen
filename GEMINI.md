# Consignes techniques — CalculNotesISEN

Le brief de refonte de novembre 2026 remplace les anciennes prescriptions « Premium v2 ». Ne pas réintroduire les ombres généralisées, grandes cartes imbriquées ou palette bleue de l’ancienne interface.

## Base conservée

Expo SDK 54, React Native 0.81.5, React 19.1, Expo Router, TypeScript strict, StyleSheet, Lucide, AsyncStorage, SecureStore, ical.js. Préserver web, Android et iOS. Voir le README pour les commandes, relais locaux et limites de validation native.

## Design

Un carnet de campus adapté à la charte du portail https://educ.isen-mediterranee.fr/fr/ : bleu nuit `#26264C`, accent corail `#EC4040`, blanc et fonds clairs `#F5F5F9`, séparateurs fins, chiffres tabulaires. La finition unslop conserve les titres éditoriaux mais utilise la police d’interface pour les chiffres, des libellés en casse de phrase et les graisses 400/500 (600 réservé au nom du produit). Éviter les petites capitales espacées et les flèches décoratives répétées. La navigation et la connexion utilisent le bleu nuit ; le corail repère les actions et sections actives. Réserver les verts aux états de réussite. Ne pas poser de petit texte blanc sur le corail vif, qui n’offre pas le contraste nécessaire. Utiliser les tokens dans `constants/Colors.ts` et `Theme.ts`, les contrôles de `Primitives.tsx` et le cadre `AppShell`. Les états sémantiques doivent toujours posséder un libellé. Cibles tactiles de 44 px ; les cours courts dans la grille ont aussi une entrée de liste accessible. Le web a des focus visibles et aucune animation n’est nécessaire aux parcours.

## Architecture et sécurité

Les routes composent les écrans ; la session et les données personnelles partagées appartiennent à `AppDataProvider`. Les accès réseau sont dans les services, les projections pures dans `utils/`. Ne pas créer de nouveau cache mémoire global indépendant.

Capturer la génération de `dataScope` avant une requête personnelle et la revérifier avant toute publication ou écriture. Utiliser un AbortSignal. Les caches sont isolés par compte, datés, validés et distingués du réseau dans l’interface. Ne jamais afficher une réponse périmée après déconnexion ou changement de compte/cursus.

Web : jeton API en mémoire ; option « Rester connecté » via `/api/session`, cookie HttpOnly/Secure/SameSite=Strict scellé en AES-256-GCM par le serveur, durée fixe de 7 jours. Identifiants chiffrés nécessaires au renouvellement, jamais persistés en clair ni accessibles au JavaScript. Clé SESSION_ENCRYPTION_KEY exclusivement serveur ; aucun préfixe EXPO_PUBLIC_. Sans option, aucune persistance. Conserver le contrôle d’origine, le marqueur de déconnexion hors ligne, la sérialisation connexion/déconnexion et les barrières de génération. Voir docs/SESSION_WEB.md. Natif : SecureStore pour les secrets, reconnexion mutualisée et bornée. La déconnexion efface les données de l’application et annule les rappels.

Le proxy calendrier doit vérifier TLS et conserver les restrictions de méthode, paramètres, délai, taille et cache privé. Ne pas journaliser de noms, identifiants, jetons, notes ou horaires personnels. La comparaison n’accède jamais aux détails personnels d’un autre étudiant via la session du titulaire.

## Règles métier

`structures_notes/` reste la référence technique de configuration ; sa conformité au règlement n’est pas établie. Les évaluations, matières et UE sont pondérées respectivement par coefficient d’évaluation, `coeff_matiere` et ECTS. Moyenne sans note = `null`. Aucune conversion des valeurs absentes en zéro ; refuser NaN et les valeurs hors 0–20. Notes hors structure et UE zéro ECTS hors moyenne du semestre. Les simulations ne modifient jamais la source.

Validation estimée : données complètes, moyenne d’UE ≥ 10, aucune matière < 6. **Rattrapage à confirmer : conserver le code de `7be717f`**, c’est-à-dire meilleur rattrapage améliorant les évaluations puis plafond UE 10 dès qu’une amélioration a été appliquée. Le responsable a demandé de maintenir ce comportement dans l’attente d’une règle fiable. Ne pas adopter l’ancienne formulation « seulement si UE initiale < 10 » sans nouvelle confirmation.

N2 et S2/N1 sont incomplets ; de nombreux codes ISEN4 (ancienne M1) sont vides. Les signaler sans inventer de correspondance ou de pondération.

## Vérification

Exécuter typecheck, lint, tests ciblés et export web après une modification substantielle. Exporter aussi les bundles Android/iOS lorsqu’un composant partagé change. Une compilation ou un aperçu web ne valent pas un essai natif. Mesurer avant d’annoncer une amélioration de performance. Maintenir README et `docs/REFONTE.md` lorsque les parcours, contrats de données ou règles changent.

## Comparaison des agendas

Conserver une grille temporelle commune en vue jour et semaine pour les agendas partagés. Les événements simultanés doivent être côte à côte au même niveau horaire, selon `layoutDay`. Les sélecteurs Jour/Semaine restent disponibles sur mobile ; une semaine comprend sept jours (lundi–dimanche). La semaine partagée doit désormais tenir dans la largeur du téléphone, sans défilement horizontal ; conserver les sept jours et l’accès aux détails. Ne pas réintroduire une liste verticale pour la comparaison quotidienne ni forcer le mode jour après un choix explicite de la semaine. L’agenda personnel garde son comportement mobile existant.

## Cursus ISEN4 et ISENA4

L’ancienne année M1 est renommée ISEN4 ; conserver l’alias en lecture des réglages et catalogues mobiles historiques. Ses fichiers existants restent dans annee_4. ISENA4 est une année distincte avec S7/S8 de 30 ECTS chacun dans annee_4_isena4. Matières et ECTS transcrits du tableau fourni ; coefficients de matière 1, évaluations provisoires à 1 à la demande du responsable. Les emplacements DS/Partiel, Projet et Entreprise sont à confirmer ; les codes d’évaluation et rattrapage restent vides tant qu’ils ne sont pas fournis. Ne pas deviner de codes ISEN ni de correspondance par nom. Afficher le caractère provisoire, préserver les simulations et les notes hors structure. Voir docs/CURSUS_ISENA4.md.
