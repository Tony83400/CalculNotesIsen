# Passe unslop — CalculNotesISEN

## Direction retenue

- **Produit :** retrouver ses cours et comprendre ses résultats ISEN.
- **Caractère :** studieux, précis, direct.
- **Univers :** le relevé de notes et l’emploi du temps d’un campus.
- **Moments forts :** le prochain cours et la grille horaire.
- **Signature :** le repère corail dans la marge.

L’audit a conduit à une passe de finition légère. La charte imposée par le responsable (bleu nuit `#26264C`, corail `#EC4040`, blanc), les familles de caractères existantes, la composition, les sections et leurs fonctions sont conservées. La carte blanche et la demande d’application autorisent cette finition ; aucune nouvelle direction de marque n’a été introduite.

## Audit et corrections, dans l’ordre des neuf passes

| Passe          | Signes repérés                                                                                           | Changement                                                                                                                                                                                 |
| -------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1. Espacement  | Marges de 17/18/22/26/34 px, grille irrégulière, navigation 46 px                                        | Espacements ramenés à la grille de 4 px, marges de page 32 px, en-tête 64 px, lignes de navigation 44 px conservant la taille tactile exigée                                               |
| 2. Couleur     | Bordures de boutons trop présentes et blocs de statut répétitifs                                         | Palette ISEN conservée ; boutons secondaires plus discrets, champs gardant leur bordure contrastée, statut neutre en texte et sémantique colorée conservée                                 |
| 3. Icônes      | Plusieurs tailles/épaisseurs de chevrons et flèches répétées sur les liens                               | Lucide à 18 px et trait 1,5 pour les contrôles, flèches décoratives retirées ; surfaces tactiles inchangées                                                                                |
| 4. Libellés    | « Au programme. », « On reprend ? », « Le campus, un peu plus clair. », slogans et ponctuation de titres | « Mon semestre », « Connexion ISEN », « Vos cours / Vos notes / Votre semestre » ; actions nommées, sections et ordre conservés                                                            |
| 5. Typographie | Petites capitales espacées, sous-titre de marque à 7,5 px, graisse 700 trop fréquente                    | Libellés en casse de phrase, méta à 11–12 px minimum, graisses 400/500 avec 600 pour le nom du produit, chiffres tabulaires en police d’interface ; Georgia reste pour les titres          |
| 6. Composition | Navigation et bandeau prenant trop de place, titres peu spécifiques                                      | Cadre légèrement plus dense et informations académiques prioritaires ; navigation responsive, composition asymétrique et ordre des sections conservés                                      |
| 7. Détails     | Mention de démonstration affichée trois fois, badges neutres et numéros décoratifs 01/02                 | Un signal de démo par écran, statut réseau/cache toujours présent hors démo, badges neutres sans fond, numéros décoratifs retirés, réactions au survol discrètes et focus visible conservé |
| 8. Visuel      | Aucun besoin d’illustration supplémentaire dans cet outil                                                | Les vrais cours, les résultats et la grille constituent le visuel. Aucun prompt d’image ni nouvel asset décoratif                                                                          |
| 9. Mouvement   | Aucun mouvement en boucle à retirer                                                                      | Parcours sans animation conservés, retour d’appui discret et prise en compte de la réduction des animations inchangée                                                                      |

Les acronymes et identifiants métier (`ISEN`, `ECTS`, `UE`, `S7`, noms de filières) gardent leur écriture. Les erreurs, informations de simulation et mentions de résultats non officiels restent explicites. L’allègement du signal de démonstration ne supprime pas les états réseau, cache ancien ou erreur des comptes réels.

## Périmètre technique

Changements de présentation uniquement dans les écrans et composants partagés. Les services, les hooks de données, la génération de session, le stockage, les JSON métier et les calculs ne sont pas modifiés. Aucune dépendance ajoutée, aucune publication en production.

Les vérifications TypeScript, lint, les 46 tests existants, les exports web/Android/iOS et le contrôle responsive sont exécutés sur cette passe. Un export natif reste une validation de bundling, sans essai sur appareil.

## Crédit

Méthode fondée sur **unslop**, créé par **Damir Sokolovsky ([@heydamir](https://x.com/heydamir))**, sous licence **[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)**. [Source du skill](https://github.com/heydamir/unslop/tree/main/skills/unslop).
