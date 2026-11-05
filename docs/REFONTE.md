# Bilan de la refonte — 5 novembre 2026

La session web persistante a été ajoutée ensuite à la demande du responsable : les mentions historiques « mémoire uniquement » ci-dessous décrivent la première livraison. Le comportement actuel et la configuration Vercel sont détaillés dans [SESSION_WEB.md](SESSION_WEB.md).

## Livraison et direction visuelle

Intervention depuis le commit **7be717f** du dépôt `Tony83400/CalculNotesIsen`, sans changement de framework. Expo 54, React Native 0.81.5, React 19.1, Expo Router, StyleSheet et TypeScript strict sont conservés. Le web reste compatible Vercel ; les mêmes écrans et services servent Android/iOS.

La direction finale reprend la charte du [portail pédagogique ISEN Méditerranée](https://educ.isen-mediterranee.fr/fr/) à la demande du responsable : **bleu nuit #26264C, corail #EC4040 et blanc**. Les couleurs ont été relevées dans les styles rendus du portail. La navigation et la connexion portent le bleu nuit ; le corail souligne l’identité et les sections actives. Les tableaux conservent des fonds clairs. Les boutons à texte blanc utilisent le bleu nuit pour leur contraste. Les couleurs sémantiques restent accompagnées de libellés.

La typographie de lecture, les chiffres tabulaires, les séparateurs fins et les sections dépliables composent un carnet étudiant. Pas de dégradé, de halo ou d’empilement de cartes avec ombres. Un monogramme `cn.` propre à CalculNotesISEN remplace les assets Expo de démonstration sur l’icône, le favicon et le lancement natif, sans copier le logo institutionnel. Crédits Anthony Coulais conservés.

## Fonctions livrées

| Parcours                 | Résultat                                                                                                                                                          |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Connexion/session        | Validation, messages, visibilité du mot de passe, claviers et soumission au clavier, chargement ; session web en mémoire, option SecureStore native               |
| Année/filières/semestres | Réglages accessibles, semestre conservé en navigation, N2 indisponible et S2/N1 incomplet signalés                                                                |
| Accueil                  | Prochain cours disponible, résultats publiés récents, moyenne provisoire, progression et raccourcis                                                               |
| Notes                    | Hiérarchie UE/matière/évaluation, coefficients, ECTS, complétude, seuils et états lisibles ; absence = « — »                                                      |
| Simulations              | Virgule ou point, précision à deux décimales, curseur local, validation explicite et réinitialisation ; source publiée préservée                                  |
| Rattrapages              | Mode séparé ; règle existante conservée et signalée à confirmer                                                                                                   |
| Hors structure           | Résultats non attribuables conservés hors moyenne ; filtrage par semestre sélectionné même sans code dans le JSON                                                 |
| Agenda personnel         | Jour sous 700 px, semaine à largeur réelle du conteneur, Aujourd’hui, dates, salles, examens, collisions, cours courts et événements sur plusieurs jours          |
| Détails                  | Association unique par intervalle début/fin ; annulation des recherches tardives, données validées, fermeture clavier et restitution du focus                     |
| Comparaison              | Ajout/retrait, recherches récentes, légende nominative, rafraîchissement réseau, échecs indépendants ; aucun détail personnel récupéré via la session pour autrui |
| Cache/actualisation      | Cache par compte et date ; provenance réseau/cache explicite ; déconnexion et réponses tardives isolées                                                           |
| Rappels natifs           | Réglage explicite, permission système, rappels à 30 minutes, quatre jours/50 rappels, annulation à la déconnexion                                                 |

La démonstration est fictive et séparée des comptes réels. Elle renseigne ses propres codes artificiels pour illustrer les parcours ; ces codes ne sont pas ajoutés aux JSON métier du projet.

## Défauts démontrés et corrections

| Priorité | Symptôme et cause vérifiés dans 7be717f                                                                             | Correction / principaux fichiers                                                                                                                                                                                                | Validation                                                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| P0       | Mot de passe et jeton web dans des cookies JavaScript d’un an                                                       | Suppression/migration ; mémoire web, secrets natifs SecureStore, effacement limité à l’application. `services/storage/base.ts`, `authStorage.ts`, `providers/AppData.tsx`, `hooks/useAuth.ts`                                   | Tests web/natif de stockage, déconnexion et renouvellement périmé ; comportement de rechargement observé en navigateur                         |
| P0       | Boucle potentiellement infinie après 401 ; renouvellements concurrents                                              | Requête protégée non récursive, renouvellement mutualisé, au plus deux appels de ressource (un seul si renouvellement initial). Délais sur en-têtes **et corps**, annulation et taille bornée. `services/http.ts`, `isenApi.ts` | 401 répétés, renouvellement simultané, expiration web, délai de lecture et génération modifiée                                                 |
| P0       | Données mémoire et caches partagés, affichage initial possible d’un autre compte                                    | Provider unique, barrière synchrone de génération, caches nommés par propriétaire, suppression des anciens caches, files d’écriture natives. `dataScope.ts`, `AppData.tsx`, `storage/`, `useMultiAgenda.ts`                     | Changement A→B avec requête A tardive, déconnexion, changement de cursus et absence de recopie des comparaisons                                |
| P0       | TLS amont désactivé ; paramètres/méthodes non bornés, logs nominaux, cache public                                   | TLS vérifié, GET/OPTIONS, noms typés/encodés/limités, délai absolu 15 s et inactivité 10 s, réponse 4 Mio, format ICS, erreurs sans identifiants, cache privé/no-store. `api/calendar.js`, `vercel.json`                        | Tests 400/405/404/502, TLS, réponse trop grande/invalide ; vérification TLS réelle des deux hôtes ISEN sans identifiant : certificats acceptés |
| P1       | « Actualiser » en comparaison réutilisait les événements ; réseau/stockage dans les fonctions de mise à jour d’état | Effet de chargement annulable, actualisation forcée, réutilisation des seuls agendas inchangés hors actualisation, erreurs par personne, persistance séparée. `hooks/useMultiAgenda.ts`                                         | Actualisation appelle à nouveau le réseau ; ajout double, retrait pendant chargement et échec individuel                                       |
| P1       | Valeur manquante transformée en zéro, NaN accepté, moyenne sans notes = 0                                           | Normalisation des API, notes valides uniquement, `null`, provenance publiée/simulée/rattrapage et complétude. `utils/notes.ts`, `types/note.d.ts`, composants notes                                                             | Pondérations, zéros réels, valeurs absentes, virgules, limites 6/10, non-mutation, simulations/reset                                           |
| P1       | Préfixes trop larges, rattrapages secondaires hors structure et semestre indéterminé si tous les codes sont vides   | Exact prioritaire, frontières et ambiguïtés contrôlées, meilleur rattrapage, notes applicables reconnues, semestre explicite pour les orphelines. `utils/notes.ts`                                                              | Préfixes, rattrapages multiples, UE zéro ECTS, notes hors structure et JSON sans codes                                                         |
| P1       | Cache corrompu provoquant une exception ; repli affiché comme une réussite réseau                                   | Enveloppe propriétaire/date validée, lecture défensive, résultat réseau séparé du cache ; quota toléré. `cacheStorage.ts`, `AppData.tsx`, `Primitives.tsx`                                                                      | JSON corrompu, quota, réseau en erreur avec ancien cache, rejet d’écriture périmée                                                             |
| P1       | ICS sans développement des récurrences ; IDs aléatoires ; détails choisis par proximité                             | RRULE/EXDATE/exceptions, VTIMEZONE et IANA via Intl, IDs stables, clipping multi-jours et collisions ; détails uniquement si intervalle unique. `utils/agenda.ts`, `AgendaGrid.tsx`, `isenApi.ts`                               | Récurrences/exclusions/déplacements, changement d’heure, fuseau sans définition, minuit, collisions chaînées et correspondances ambiguës       |
| P2       | Calcul global relancé au rendu et pendant chaque variation de curseur                                               | Projections dérivées stabilisées, copies ciblées, index exact, saisie/curseur locaux jusqu’à Appliquer. `utils/notes.ts`, `app/notes.tsx`, `MatiereCard.tsx`                                                                    | Profil du calcul ci-dessous ; 100 variations simulées produisent zéro commit métier avant Appliquer et un seul après                           |
| P2       | Écran d’accueil réduit à trois liens, six colonnes comprimées sur téléphone, contrôles disparates                   | Cadre responsive, primitives et tokens communs ; synthèse, jour mobile, semaine par conteneur, réglages accessibles. `AppShell.tsx`, `app/`, `components/ui/`, `Theme.ts`                                                       | Parcours en navigateur à 390/768/1440 px et captures fictives                                                                                  |
| P2       | Chemin S1 comportant une casse différente du fichier réel                                                           | `S1_CIN.Json` → `S1_CIN.json` dans `structures_notes/structure.json`                                                                                                                                                            | Validation de tous les JSON embarqués et sélection de cursus typée                                                                             |

## Choix métier non tranchés

**Le responsable a demandé de garder la règle actuelle de rattrapage en attendant confirmation.** Le meilleur rattrapage applicable améliore les évaluations concernées ; dès qu’une évaluation est améliorée, la moyenne d’UE est plafonnée à 10, même pour une UE initialement à 10 ou plus. L’ancienne phrase de GEMINI.md était différente. Le comportement est testé et explicitement signalé dans l’interface ; aucun règlement officiel n’est revendiqué.

La moyenne d’UE ≥ 10, le seuil de matière ≥ 6, la pondération par ECTS et l’exclusion des UE à zéro ECTS décrivent le calcul technique actuel. Leur conformité au règlement de chaque cursus n’est pas certifiée. Une moyenne partielle reste provisoire et ne valide aucune UE incomplète.

## Limites du catalogue démontrées

- **N2 : aucun semestre** ; l’année est désactivée dans le sélecteur.
- **N1/S2 : tableau vide** ; un état explicite remplace une moyenne inventée.
- **S7 M1 : 14 à 17 codes vides selon la filière** ; DEV_LOGICIEL contient 15 codes vides sur 17 évaluations.
- **S8 M1 : tous les codes sont vides** ; DEV_LOGICIEL en contient 10 sur 10.
- **S6 BIOST/CPGE/UE : un code vide.**

Les notes concernées ne peuvent pas être rattachées automatiquement avec certitude. Elles restent consultables hors structure ; aucune correspondance n’a été devinée et aucune pondération métier n’a été modifiée.

## Mesures et vérifications

- **46 tests, 10 fichiers : réussite.** Fixtures et HTTP simulés uniquement.
- **TypeScript strict : réussite. Lint : réussite sans avertissement.**
- **Export web : réussite**, neuf routes statiques ; bundle affiché par Expo ≈ 3,13 Mo non compressés.
- **Exports Hermes Android et iOS : réussite.** Cela valide le bundling, pas la construction d’un APK/IPA ni l’exécution native.
- **Navigateur : 1440×1000, 768×1000 et 390×844.** Navigation, notes, semestre sans notes, simulation décimale/reset, agenda jour/semaine, détails, ajout/retrait et légende multi-agenda, réglages, validation de connexion et rechargement sans session. Pas de débordement de la page observé ; la semaine utilise un défilement horizontal interne si nécessaire.
- **Clavier/focus :** Tab entre les champs, soumission au clavier, focus visible, fermeture de la fiche par Échap et retour au cours d’origine vérifiés. Noms accessibles et états dépliés exposés. Animation de parcours désactivée ; CSS `prefers-reduced-motion` et texte natif redimensionnable conservés.
- **Contrastes de la palette sur fond clair :** texte principal ≈13,19:1, secondaire ≈6,60:1, tertiaire ≈5,12:1 ; navigation claire sur bleu nuit ≈9,80:1 ; bordures de contrôles ≈3,78:1. Les textes ne reposent pas sur le corail vif pour satisfaire le contraste.

### Performance : limites des conclusions

Microbenchmark reproductible sous Node 26.13, 2 000 mesures après échauffement, structure S7 DEV à 17 évaluations et 252 notes fictives : médiane **0,02075 ms avant**, **0,02800 ms après** ; p95 **0,02625 / 0,03513 ms**. Le calcul pur ajoute des validations et des informations de provenance ; il n’est pas plus rapide sur ce petit jeu. Aucun gain CPU global n’est annoncé. Résultats bruts dans `benchmark-notes.json`.

L’amélioration vérifiée des interactions est l’absence de commit global pendant 100 variations de curseur, puis un commit sur Appliquer. Ce test ne mesure ni les images par seconde ni les appareils physiques. L’adaptateur `notifications.web.ts` retire aussi les modules natifs du bundle web : environ 3,26 → 3,13 Mo dans deux exports successifs de la refonte ; ce n’est pas une comparaison au bundle original en production.

## Vérifications restant à faire et risques à reproduire

1. **Connexion et données réelles ISEN :** API authentifiée et calendrier personnel non validés avec un compte dans cette intervention. Les contrats existants ont été conservés et les réponses simulées ; aucun mot de passe n’a été demandé dans le chat ni utilisé pour les captures.
2. **Appareils Android/iOS :** SDK Android absent ; Xcode présent mais aucun appareil/runtime de simulateur disponible. Construire et tester les development builds : claviers, grands textes, zones sûres, rotation, SecureStore, rappels, refus de permission, VoiceOver/TalkBack et consommation réseau.
3. **Agendas réels :** les variations ICS exotiques et la disponibilité amont restent à confirmer. Expansion bornée à trois années civiles autour de l’année courante et 20 000 occurrences par série ; les fuseaux inconnus et les calendriers invalides donnent une erreur plutôt qu’une heure arbitraire.
4. **Accès aux ICS :** le service amont est publiquement adressable par nom. Le proxy ne prétend pas ajouter une autorisation institutionnelle absente de l’amont. Clarifier cette politique avec l’établissement si le service doit devenir privé.
5. **Web persistant :** désormais implémenté avec une case explicite et `/api/session`. Configurer SESSION_ENCRYPTION_KEY dans Vercel avant d’activer la mémorisation en production, puis valider la reprise avec un vrai compte ISEN. Voir SESSION_WEB.md ; aucun mot de passe persistant en clair.
6. **Déploiement Vercel :** configuration et code livrés localement ; aucun push ou déploiement de production effectué. Refaire un essai authentifié après déploiement pour vérifier les réécritures et la fonction calendrier dans l’environnement Vercel.

Les captures livrées utilisent exclusivement les données fictives de la démonstration. Le README détaille l’installation, les commandes, les responsabilités et la maintenance des structures.
