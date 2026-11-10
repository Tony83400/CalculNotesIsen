# CalculNotesISEN

Application pour consulter ses résultats académiques, estimer ses moyennes, simuler des notes et organiser son emploi du temps à l'ISEN. Application commune **web, Android et iOS**, construite avec Expo SDK 54, React Native 0.81.5, React 19.1, Expo Router et TypeScript strict.

Créé par **Anthony Coulais**. Application indépendante : les moyennes et ECTS affichés sont des estimations, sans valeur de résultat officiel.

## Lancer le projet

Prérequis : Node **22.12+, 24.x ou 26+**, npm et Git.

```bash
npm ci
npm run web
```

Le web est exporté puis servi sur **http://127.0.0.1:8081** avec les relais serveur nécessaires :
- `/api/session` pour la connexion mémorisée sécurisée (AES-256-GCM).
- `/api-proxy` pour relayer les requêtes vers l'API ISEN sans blocage CORS.
- `/api/calendar` pour le proxy d'agenda ICS.

Pour le développement avec Metro et rechargement à chaud :
```bash
npm run web:dev
```

### Android et iOS

```bash
npm start
npm run android
npm run ios
```

Les commandes natives nécessitent respectivement le SDK Android ou Xcode avec un runtime iOS. Les secrets sont enregistrés de façon sécurisée via `SecureStore`.

## Vérifier

```bash
npm run typecheck
npm run build:web
```

## Parcours

- **Connexion** : identification avec identifiants ISEN (`prenom.nom`), case « Rester connecté » sécurisée (7 jours sur le web, SecureStore sur mobile).
- **Tableau de bord** (`/selection`) : vue d'ensemble avec accès directs vers les Notes, l'Agenda, la Comparaison et la Configuration du cursus.
- **Notes** (`/notes`) : UE → matière → évaluation, moyennes pondérées, coefficients, ECTS et seuils. Simulations interactives par slider ou saisie directe, réinitialisation et mode rattrapage.
- **Agenda** (`/agenda`) : affichage par Jour ou Semaine, cours simultanés placés côte à côte, badges d'examens et modal détaillée (salles, intervenants, étudiants présents).
- **Comparer les agendas** (`/multi-agenda`) : ajout d'étudiants par prénom/nom, historique récent, superposition des emplois du temps avec code couleur dédié.
- **Cursus** (`/selectionAnnee`) : sélection de l'année d'études (incluant **ISEN4** et **ISENA4**) et des filières par semestre.
