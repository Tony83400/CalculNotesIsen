# Agendas partagés : grille horaire jour et semaine

La comparaison quotidienne reprend le principe de la version originale : une seule échelle horaire, avec les cours simultanés placés côte à côte, à la même hauteur. Leur hauteur reste proportionnelle à leur durée ; les décalages de début et de fin sont conservés.

Le sélecteur **Jour / Semaine** est disponible sur web, Android et iOS, y compris sur téléphone. Par défaut, la comparaison ouvre le jour sur petit écran et la semaine sur grand écran. Le choix explicite de la semaine reste utilisable sur mobile. La semaine va du **lundi au dimanche** ; un défilement horizontal interne garde les colonnes lisibles. La vue jour accepte aussi le défilement interne si de nombreux cours se chevauchent.

Les cours affichent le nom de l’agenda, le titre, les horaires et la salle lorsque la hauteur le permet. La fiche reste accessible pour toutes ces informations, notamment sur les cours courts. La comparaison ne recherche aucun détail personnel via la session du titulaire. Les couleurs et la légende nominative restent celles de la refonte ISEN.

## Fichiers

- `AgendaGrid.tsx` : composant partagé pour un ou sept jours ; même algorithme de collisions, sans dupliquer la logique horaire.
- `app/multi-agenda.tsx` : grille en mode jour comme en mode semaine, sans liste quotidienne empilée.
- `useCalendarNavigation.ts`, `useMultiAgenda.ts` : choix de vue explicite autorisé sur petit écran pour la comparaison.
- `CalendarToolbar.tsx`, `Primitives.tsx` : boutons Jour/Semaine et état de sélection accessible.

L’agenda personnel conserve sa liste mobile. Les accès réseau, le cache, le stockage, les règles de notes et les données du cursus ne changent pas.

## Vérification

Huit tests ciblés supplémentaires vérifient : alignement côte à côte et hauteurs des cours identiques, cours décalés, filtre quotidien, sept jours jusqu’au dimanche, exclusion du lundi suivant, détails limités aux horaires partagés, largeur réelle du conteneur, défilement en cas de trois chevauchements, choix de la semaine sur téléphone, conservation du jour sélectionné et navigation d’un ou sept jours.

La suite complète compte **54 tests**. TypeScript, lint et export web passent. Les bundles Android/iOS sont exportés ; l’essai natif sur appareil reste à réaliser. Les captures de contrôle utilisent uniquement des personnes et cours fictifs.
