# 🚀 CalculNotesIsen - Documentation Technique & Développement

> [!IMPORTANT]
> Ce fichier **DOIT** être régulièrement mis à jour après chaque changement architectural, modification des règles métier ou mise à jour du système de design. Il sert de boussole technique pour Gemini.

## 🛠️ Stack Technique
- **Framework :** Expo (SDK 54) avec React Native (0.81).
- **Navigation :** Expo Router (File-based routing, v6).
- **Langage :** TypeScript (Strict mode).
- **Styles :** StyleSheet standard avec un système de constantes évolué (`constants/Colors.ts`).
- **Icônes :** `lucide-react-native`.
- **Animations :** `react-native-reanimated` (v4) et `expo-haptics` pour les retours tactiles. 
- **Stockage :** `@react-native-async-storage/async-storage` et `expo-secure-store`.
- **Utilitaires :** `ical.js` (Agenda), `Vercel Analytics`.

## 📏 Règles Métier (ISEN)

### Validation des UE
Pour qu'une Unité d'Enseignement (UE) soit validée, deux conditions sont nécessaires :
1. **Moyenne de l'UE ≥ 10/20**.
2. **Aucune matière constitutive de l'UE n'a une moyenne < 6/20** (Note éliminatoire).

### Calcul des Moyennes & Rattrapages
- **Matière :** Moyenne pondérée des évaluations selon leurs coefficients respectifs.
- **UE :** Moyenne pondérée des matières selon les coefficients de matière.
- **Semestre :** Moyenne pondérée des UE selon leurs ECTS.
- **Logique de Rattrapage :** 
  - Si la moyenne initiale de l'UE est `< 10`, la nouvelle moyenne (après rattrapage) est **plafonnée à 10**.
  - Si la moyenne initiale de l'UE est `≥ 10`, la moyenne initiale est conservée (le rattrapage sert uniquement à lever une note éliminatoire `< 6`).

## 🎨 Système de Design (Premium v2)
- **Primary :** `#2563EB` (Bleu Royal moderne).
- **Background :** `#F1F5F9` (Gris ardoise très clair pour le contraste).
- **Success :** `#10B981` (Vert émeraude).
- **Error :** `#F43F5E` (Rose-rouge corail).
- **Rayons de courbure (Border Radius) :** 
  - `24px` pour les grandes cartes principales (`UeCard`).
  - `16px` pour les sous-sections et éléments internes.
  - `12px` pour les boutons et badges.
- **Ombres (Shadows) :** Opacité très faible (`0.02` à `0.04`) avec un rayon de diffusion large pour un effet premium et léger.
- **Typographie :** Graisses `800` pour les titres et moyennes `600/700` pour les informations clés. Espacement des lettres (`letterSpacing: -0.5`) sur les titres.

## 📂 Structure du Code
- `app/` : Routes de l'application (Navigation).
- `components/ui/` : Composants atomiques et cartes complexes (`agenda/`, `notes/`).
- `services/` : Appels API (`isenApi`, `agendaApi`, `configApi`) et gestion du stockage (`storage.ts`).
- `utils/` : Logique pure de traitement de données (`notes.ts`, `agenda.ts`, `notifications.ts`).
- `hooks/` : Hooks personnalisés (`useAgenda.ts`).
- `types/` : Definitions TypeScript globales.
- `structures_notes/` : **Source de vérité pour la configuration.** Contient `structure.json` (global), les fichiers par semestre, et `localMapping.ts`.

## ⌨️ Standards de Code pour Gemini
1. **Typage :** Toujours définir des interfaces dans `types/` avant d'implémenter une nouvelle fonctionnalité.
2. **Surgical Updates :** Utiliser `replace` avec un contexte suffisant pour éviter les erreurs de duplication.
3. **Architecture Config :** **NE JAMAIS** utiliser `structure_note.json` (legacy supprimé). Toujours utiliser `structures_notes/structure.json` via `configApi.ts`.
4. **Validation :** Après chaque changement de logique de calcul, vérifier l'impact dans `utils/notes.ts`.
5. **Performance :** Utiliser `useCallback` et `useMemo` pour les calculs lourds et les listes.
6. **UI Premium :** Toujours respecter le système de design v2 (arrondis généreux, ombres douces).

## 🔄 Flux de Données
1. **Notes :** Récupération via `isenApi.ts` -> Cache (`storage.ts`) -> Fusion avec la structure (`utils/notes.ts`) -> Affichage.
2. **Config Globale (`structure.json`) :** Chargée via `updateStructureConfig` (configApi.ts).
    - **Web :** Mapping local par défaut.
    - **Native :** Cache (`storage.ts`) -> GitHub RAW -> Fallback Local.
    - **Actualisation :** Le bouton "Actualiser" force le téléchargement GitHub et met à jour le cache.
3. **Config Semestre :** Chargée via `fetchSemesterStructure` (configApi.ts) après sélection de l'année/filière.
    - **Web :** Mapping local (bundled).
    - **Native :** Cache (`StructureConfig_` prefix) -> GitHub RAW -> Fallback Local.
4. **Agenda :** Récupération via `agendaApi.ts` -> Parsing `ical.js` (`utils/agenda.ts`) -> Hook `useAgenda.ts`.
5. **Notifications :** Programmées via `notifications.ts` (30 min avant le cours, limité aux 4 prochains jours, build natif uniquement).
6. **Simulations :** Les notes simulées par l'utilisateur sont stockées localement et fusionnées en temps réel dans `getDonneesAvecNotes`.
7. **Cache & Refresh :** `clearAppCache` (storage.ts) vide l'agenda, les notes et toutes les structures configurées (globales et semestres) pour garantir une fraîcheur totale lors d'un refresh manuel.
