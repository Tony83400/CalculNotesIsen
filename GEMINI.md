# Consignes techniques — CalculNotesISEN

Interface historique réappliquée (base `7be717f`) combinée aux fiabilisations techniques, sécuritaires et métier.

## Base conservée

Expo SDK 54, React Native 0.81.5, React 19.1, Expo Router, TypeScript strict, StyleSheet, Lucide, AsyncStorage, SecureStore, ical.js. Préserver web, Android et iOS.

## Design

Interface originale restaurée :
- Palette de couleurs : Bleu Royal `#2563EB`, surfaces blanches, arrière-plan contrasté `#F1F5F9`, vert `#10B981`, orange `#F59E0B`, rouge `#F43F5E`.
- Cartes arrondies avec ombres douces et bordures fines (`Colors.border`, `Colors.divider`).
- Navigation directe et claire :
  - Connexion sobre avec redirection directe.
  - Tableau de bord (`/selection`) vers Notes, Agenda, Multi-Agenda, Cursus.
  - Écran des notes (`/notes`) avec cartes d'UE dépliables, moyennes, simulations par slider/clic et mode rattrapage.
  - Agenda (`/agenda`) avec bascule Jour/Semaine directe.
  - Comparaison multi-agenda (`/multi-agenda`) avec couleurs distinctes par étudiant.
- Pas de données fictives ni de mode démonstration : l'application fonctionne avec des comptes réels.

## Architecture et sécurité

- Les routes composent les écrans ; l'état applicatif unifié est géré par `AppDataProvider`.
- Les accès réseau sont dans `services/`, les projections pures de calcul dans `utils/`.
- `dataScope` isole les requêtes asynchrones par utilisateur : invalidation immédiate en cas de déconnexion ou changement de compte.
- **Sécurité Web** : jeton API en mémoire ; option « Rester connecté » via `/api/session`, cookie HttpOnly/Secure/SameSite=Strict scellé en AES-256-GCM par le serveur (7 jours). Clé `SESSION_ENCRYPTION_KEY` exclusivement serveur. Aucun mot de passe en clair dans le cache ou localStorage.
- **Sécurité Mobile** : `SecureStore` pour les secrets, reconnexion mutualisée et bornée.
- **Proxy calendrier** (`api/calendar.js`) : vérification TLS stricte amont (`rejectUnauthorized: true`), validation stricte des paramètres, limitation de taille (4 Mo) et timeout (15s).

## Règles métier

- `structures_notes/` est la référence de configuration.
- Les évaluations, matières et UE sont pondérées respectivement par coefficient d'évaluation, `coeff_matiere` et ECTS.
- Moyenne sans note = `null`. Aucune conversion des valeurs absentes en zéro ; refuser NaN et les valeurs hors 0–20.
- Notes hors structure et UE zéro ECTS sont hors moyenne du semestre.
- Les simulations ne modifient jamais les sources de données (projection pure immuable).
- **Rattrapages** : meilleur rattrapage applicable améliorant les évaluations, puis plafond UE 10 dès qu'une amélioration est appliquée.
- **Cursus ISEN4 et ISENA4** :
  - Ancienne M1 renommée ISEN4 (alias rétro-compatible).
  - ISENA4 est une année distincte (S7/S8 de 30 ECTS chacun dans `annee_4_isena4/`).
