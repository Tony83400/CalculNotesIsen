# CalculNotesISEN

Un carnet de campus pour consulter ses résultats, estimer ses moyennes, simuler des notes et organiser ses cours. Application commune **web, Android et iOS**, construite avec Expo SDK 54, React Native 0.81.5, React 19.1, Expo Router et TypeScript strict.

La charte reprend le bleu nuit **#26264C**, le corail **#EC4040** et le blanc observés sur le [portail pédagogique de l’école](https://educ.isen-mediterranee.fr/fr/), avec des surfaces claires pour les tableaux. Les icônes et le lancement natifs utilisent le même monogramme CalculNotesISEN, sans reproduire le logo institutionnel.

Créé par **Anthony Coulais et Mattéo Sautron**. Application indépendante : les moyennes et ECTS affichés sont des estimations, sans valeur de résultat officiel.

## Lancer le projet

Prérequis : Node **22.12+, 24.x ou 26+** (voir `engines`), npm et Git. Le dépôt contient le lockfile ; utiliser `npm ci`.

```bash
npm ci
npm run web
```

Le web est exporté puis servi sur **http://127.0.0.1:8081** avec les relais serveur nécessaires (`/api/session` pour la connexion mémorisée, `/api-proxy` pour l’API ISEN et `/api/calendar` pour les ICS). `PORT=8082 npm run preview` permet de choisir un autre port après un export. Le serveur de prévisualisation écoute uniquement sur la boucle locale.

**Découvrir avec des données fictives** permet d’explorer toute l’interface sans compte et sans appel aux données personnelles. Les noms saisis dans la comparaison restent fictifs dans ce mode. La démo se termine au rechargement.

Pour le développement d’interface avec Metro et actualisation automatique : `npm run web:dev`. Ce serveur Metro seul ne fournit pas les fonctions Vercel : utiliser la démo, ou `npm run web` pour la connexion réelle. Après une modification, relancer `npm run build:web` puis recharger l’aperçu statique.

### Android et iOS

```bash
npm start
npm run android
npm run ios
```

Les deux dernières commandes nécessitent respectivement le SDK Android ou Xcode avec un runtime iOS, ainsi que les outils de compilation natifs. Elles génèrent les projets natifs Expo localement. Un **development build** est nécessaire pour vérifier les rappels et SecureStore dans les conditions réelles ; un aperçu web mobile ne valide pas le natif.

Les rappels sont activés dans **Mon cursus**, demandent l’autorisation de l’appareil et sont programmés lors d’une récupération réseau réussie de l’agenda : 30 minutes avant les cours, sur les quatre prochains jours, au maximum 50 notifications. La déconnexion les annule. Il n’y a pas de synchronisation de fond garantie lorsque l’application est fermée.

## Vérifier

```bash
npm run typecheck
npm run lint
npm test
npm run build:web
npm run build:native
npm run benchmark
```

Les tests utilisent uniquement des fixtures fictives, des réponses HTTP simulées et des adaptateurs de stockage simulés. Les tests de composants utilisent `react-test-renderer` ; ils ne remplacent pas les essais VoiceOver, TalkBack ou sur appareil. Le benchmark compare le calcul actuel à la copie du calcul de `7be717f` et écrit ses modules temporaires dans `.bench/`.

Vercel utilise `npm run build:web`, le dossier `dist`, les fonctions `api/calendar.js` et `api/session.js` ainsi que la réécriture `/api-proxy` vers l’API ISEN. **Ne pas héberger uniquement `dist/` sur un serveur statique pour une utilisation connectée** : les relais serveur sont nécessaires. Les réponses personnelles du proxy sont marquées `private, no-store`. La refonte n’effectue aucune publication automatique sur le site existant.

## Parcours

- **Accueil** : prochain cours disponible, derniers résultats publiés, progression du semestre et accès rapides.
- **Mes notes** : semestre mémorisé, UE → matière → évaluation, moyennes pondérées, coefficients, ECTS et états provisoires. Une matière se déplie pour simuler une évaluation.
- **Simulations** : saisir une valeur de 0 à 20 (virgule ou point, deux décimales), éventuellement ajuster le curseur, puis **Appliquer**. Réinitialisation par évaluation ou pour tout le semestre. Les hypothèses restent en mémoire, par semestre ; elles survivent aux navigations mais disparaissent au rechargement, à la déconnexion ou au changement de cursus.
- **Rattrapages** : mode distinct conservant la règle existante, explicitement marquée à confirmer.
- **Mon agenda** : semaine sur grand écran, jour sous 700 px, navigation temporelle, Aujourd’hui et détails du cours. Les petits écrans n’affichent pas sept colonnes comprimées. La semaine déborde horizontalement dans son propre conteneur si nécessaire.
- **Comparer les agendas** : ajout/retrait, historique récent, légende nominative, erreurs indépendantes et actualisation réseau effective. Les détails personnels de cours ne sont jamais demandés pour un autre agenda avec la session du titulaire.
- **Mon cursus** : année, filière par semestre, rappels natifs et déconnexion. La navigation devient latérale à partir de 1080 px ; elle reste en bas sur les écrans plus étroits.

Les icônes sont fournies dans `assets/brand/`. Leurs sources vectorielles sont `mark.svg` et `scripts/generate-brand-assets.swift`. Sur macOS, on peut les régénérer avec `swift -module-cache-path /tmp/cnisen-swift-cache scripts/generate-brand-assets.swift`.

## Organisation du code

| Emplacement                                                       | Responsabilité                                                                                      |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `app/`                                                            | Routes et composition des écrans ; `selectionSemestre` reste une redirection de compatibilité       |
| `components/AppShell.tsx`                                         | Identité, navigation responsive, cadre commun                                                       |
| `constants/Colors.ts`, `Theme.ts`, `components/ui/Primitives.tsx` | Palette, tokens, boutons, champs et états communs                                                   |
| `providers/AppData.tsx`                                           | Session courante, cursus, ressources personnelles partagées, provenance réseau/cache et simulations |
| `services/dataScope.ts`                                           | Génération synchrone : empêche les réponses d’une session précédente de publier leurs résultats     |
| `services/isenApi.ts`, `http.ts`                                  | Validation des réponses, délais, reconnexion mutualisée et bornée                                   |
| `services/storage/`                                               | SecureStore, jeton web en mémoire, caches nommés par compte et migration                            |
| `hooks/useCalendarNavigation.ts`, `useMultiAgenda.ts`             | Navigation commune des agendas et chargement indépendant des comparaisons                           |
| `utils/notes.ts`, `utils/agenda.ts`                               | Calculs purs, validation, ICS, récurrences et collisions                                            |
| `structures_notes/`                                               | Configuration métier de référence, conservée                                                        |
| `tests/`, `docs/`                                                 | Non-régressions et bilan de la refonte                                                              |

Les anciens hooks `useNotesData` et `useAgenda` sont de petits adaptateurs vers les données communes. Ajouter une nouvelle source de données dans les services plutôt que dupliquer un cache dans un écran.

## Session et données locales

**Web :** la case **Rester connecté sur cet appareil** est disponible à la connexion. Décochée : jeton en mémoire uniquement, reconnexion après rechargement. Cochée : reprise automatique pendant **7 jours**, y compris après fermeture du navigateur, grâce à un vrai cookie **HttpOnly, Secure, SameSite=Strict** créé par `/api/session`. Le jeton API reste en mémoire ; les identifiants nécessaires au renouvellement sont chiffrés et authentifiés par le serveur (AES-256-GCM) dans le cookie, jamais en clair ni dans localStorage. La clé de déchiffrement reste exclusivement sur le serveur. Cette stratégie n’invente pas de refresh token absent du contrat actuel de l’API. La durée de 7 jours est fixe, sans prolongation à chaque visite. Déconnexion, choix décoché lors d’une nouvelle connexion et entrée en démo suppriment la mémorisation. Une déconnexion hors ligne laisse un marqueur local non secret qui bloque toute reprise et impose de réessayer la suppression du cookie. Un cookie refusé ou expiré redemande une connexion ; une panne ISEN temporaire ne le supprime pas.

**Configuration serveur :** `npm run preview` crée automatiquement une clé locale dans `.env.local` (ignoré par Git), réutilisée aux lancements suivants. Sur **Vercel**, définir **SESSION_ENCRYPTION_KEY** avec **64 caractères hexadécimaux aléatoires**, indépendants de la clé locale, dans les environnements Production/Preview concernés, puis redéployer. On peut générer la valeur avec `openssl rand -hex 32` dans son terminal. Ne jamais employer le préfixe `EXPO_PUBLIC_`, publier cette valeur ni committer un vrai fichier `.env`. La connexion temporaire reste utilisable sans cette clé ; une tentative de mémorisation affiche une erreur explicite si elle manque. Changer la clé invalide les cookies de mémorisation existants. Voir [le fonctionnement, les tests et les limites](docs/SESSION_WEB.md).

**Natif :** jeton et, si « Rester connecté » est coché, identifiants dans SecureStore. La durée locale d’une heure est une estimation conservée du projet ; les réponses 401 restent déterminantes. Une seule reconnexion est partagée entre les requêtes simultanées ; un appel protégé n’est jamais relancé récursivement.

Les données personnelles en cache sont nommées par compte, versionnées avec une date de récupération et effacées à la déconnexion/changement de compte. Les anciens cookies web et anciens caches non isolés sont supprimés. Le stockage non secret utilise le préfixe `cnisen:v3:`. L’application n’efface pas le stockage des autres applications du même domaine.

Les états distinguent **actualisation**, **récupération réseau**, **données conservées**, **absence** et **erreur/session expirée**. Un repli sur cache ne devient jamais « À jour ».

## Règles de calcul et limites du catalogue

Les évaluations sont pondérées par leur coefficient, les matières par `coeff_matiere`, les UE par leurs ECTS. Les UE à zéro ECTS et les notes hors structure n’entrent pas dans la moyenne du semestre. Les notes absentes ou invalides restent absentes, jamais converties en zéro. Une moyenne partielle exclut les valeurs manquantes et reste provisoire. Une validation estimée exige toutes les évaluations, une moyenne d’UE ≥ 10 et toutes les moyennes de matière ≥ 6. Cela ne certifie pas le règlement pédagogique.

**Rattrapage : règle à confirmer.** À la demande du responsable du projet, le comportement de `7be717f` est conservé : le meilleur rattrapage applicable améliore les évaluations concernées puis plafonne l’UE à 10 dès qu’il a amélioré une évaluation, même si l’UE était initialement à 10 ou plus. La divergence avec l’ancienne documentation est consignée ; aucun règlement officiel ne l’a tranchée dans cette intervention.

**Données incomplètes :** N2 n’a aucun semestre et N1/S2 est un tableau vide. Les fichiers M1 ont beaucoup de codes d’évaluation vides (S7 DEV : 15/17 ; S8 DEV : 10/10). L’application les signale ; elle ne peut pas attribuer automatiquement un résultat à une évaluation sans code. Les notes non associées apparaissent hors moyenne. Seule la casse du chemin `S1_CIN.json` a été corrigée dans le catalogue global ; aucune pondération ni valeur métier n’a été inventée.

Pour maintenir le catalogue : modifier le JSON du semestre, conserver les coefficients positifs et les ECTS non négatifs, renseigner les codes API exacts, puis actualiser `structure.json` et `localMapping.ts` si un fichier est ajouté. Les associations par préfixe exigent une frontière `_`, privilégient un code exact et refusent les correspondances ambiguës. Vérifier les tests sur **tous les JSON**. Sur web, les structures sont embarquées et demandent un nouvel export ; sur mobile, Actualiser essaie GitHub puis les références locales validées.

Les ICS développent les récurrences entre le début de l’année précédente et le début de l’année +2, avec un plafond de 20 000 itérations par série. VTIMEZONE est prioritaire ; un TZID IANA sans définition utilise `Intl`. Une date sans fuseau explicite suit celui de l’appareil. Les cas exotiques ou inconnus sont signalés plutôt qu’assimilés silencieusement à UTC. Voir la [documentation ical.js](https://kewisch.github.io/ical.js/) concernant les définitions de fuseau.

Le service ICS amont est publiquement adressable par prénom/nom. Le proxy borne les paramètres, vérifie TLS et impose délais/taille, sans prétendre fournir un contrôle d’accès ISEN absent du service amont. Un durcissement des autorisations nécessite une capacité et une politique institutionnelles documentées.

Le bilan des corrections, des mesures et des limites de validation figure dans [docs/REFONTE.md](docs/REFONTE.md).

La passe de finition typographique et ergonomique basée sur unslop est décrite dans [docs/UNSLOP.md](docs/UNSLOP.md).

La comparaison propose désormais **Jour** et **Semaine** sur tous les formats. La vue jour utilise une grille horaire : les cours simultanés sont côte à côte sur la même plage, avec le nom de l’agenda, l’horaire et la salle. La semaine couvre le lundi au dimanche et défile horizontalement sur petit écran. L’agenda personnel conserve sa liste quotidienne mobile. Voir [docs/CALENDRIERS_PARTAGES.md](docs/CALENDRIERS_PARTAGES.md).
