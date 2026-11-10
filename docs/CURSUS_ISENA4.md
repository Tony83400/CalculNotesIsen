# ISENA4 et renommage de M1 en ISEN4

Ajout demandé par le responsable à partir de la capture du tableau « ISENA4 ». Le tableau sert de source aux modules, cours, coefficients de matière et ECTS. Il ne fournit ni codes API ni détail des évaluations. Aucun changement des règles de validation ni des pondérations de l’ancien cursus M1 n’est effectué.

## Semestre S7 — 30 ECTS

| Module                  | Cours, coefficient 1 chacun                   | ECTS |
| ----------------------- | --------------------------------------------- | ---: |
| Sciences de l’ingénieur | Élec de puissance ; Auto ; Radiocom           |    5 |
| Informatique            | POO ; Système d’exploitation ; Projet Info    |    5 |
| Sciences humaines       | Gestion de la qualité ; Management des hommes |    5 |
| Anglais                 | Anglais                                       |    5 |
| Entreprise              | Entreprise                                    |   10 |

## Semestre S8 — 30 ECTS

| Module                  | Cours, coefficient 1 chacun                                                                      | ECTS |
| ----------------------- | ------------------------------------------------------------------------------------------------ | ---: |
| Sciences de l’ingénieur | Linux embarqué ; VHDL                                                                            |    5 |
| IoT                     | SmartCard ; IoT ; Projet IoT                                                                     |    5 |
| CYBER/IA                | Android ; Java ; Cyber ; IA                                                                      |    6 |
| Sciences humaines       | Méthodologie de recherche ; Management de la SST ; Droit et éthique ; Stratégie de développement |    4 |
| Entreprise              | Entreprise                                                                                       |   10 |

## Évaluations provisoires

Le responsable demande **1 par défaut** tant que les coefficients des DS et partiels ne sont pas disponibles. Des emplacements **DS** et **Partiel**, chacun à 1, sont préparés pour les cours. **Projet Info**, **Projet IoT** et **Entreprise** ont un seul emplacement dédié à 1. Cette répartition est une préparation technique pour les simulations ; elle n’atteste pas du nombre réel d’évaluations de chaque cours. Elle est signalée comme provisoire dans les notes. S7 comporte 17 évaluations et S8 en comporte 26. En S7, Élec de puissance comporte uniquement un partiel à coefficient 1, associé au code `26_ISENA4_TLN_S7_ELECPUISS`.

Les codes d’évaluation et de rattrapage sont renseignés à mesure qu’ils sont fournis. Les notes publiées sans correspondance restent consultables hors structure et hors moyenne. Les écrans notes et réglages signalent les codes manquants.

Pour compléter : ajuster les noms/nombres d’évaluations et leurs coefficients, renseigner les codes ISEN exacts dans les deux JSON et les codes de rattrapage éventuels, puis exporter/retester l’application. Les deux fichiers sont la configuration technique de référence ; leur conformité au règlement n’est pas certifiée.

## Intégration et compatibilité

- `structures_notes/structure.json` expose **ISEN4** à la place de M1 et ajoute **ISENA4**, filière unique « Cursus commun », pour S7/S8.
- Les fichiers existants `annee_4/` et leurs URLs sont conservés : les notes, filières et pondérations d’ISEN4 ne changent pas.
- `annee_4_isena4/S7_ISENA4.json` et `S8_ISENA4.json` sont embarqués dans `localMapping.ts` pour web, Android et iOS.
- Une sélection historique M1 est interprétée comme ISEN4 en lecture ; les nouvelles écritures utilisent ISEN4. Le semestre, les filières et les URLs sont conservés. ISENA4 reste une année indépendante.
- Les anciens catalogues mobiles en cache ou téléchargés sont renommés et complétés par les années embarquées. Un catalogue qui fournit déjà ISEN4 est prioritaire sur son alias M1. Les semestres ISENA4 embarqués restent utilisables si les nouveaux fichiers ne sont pas encore publiés sur GitHub.
- La démonstration affiche ISEN4 et conserve ses données fictives existantes.

## Vérification

Neuf tests ajoutés couvrent le catalogue et les fichiers embarqués, les modules/ECTS, les coefficients à 1, l’absence de codes inventés, la moyenne DS/partiel, l’absence de notes, la simulation pondérée par ECTS des deux semestres, la réinitialisation sans mutation, les sélections historiques web/natives et les anciens catalogues mobiles. La suite complète compte **83 tests**. TypeScript, lint et exports web/Android/iOS sont exécutés avec des données fictives ; un export natif ne remplace pas l’essai sur appareil.
