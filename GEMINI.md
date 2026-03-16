# 🚀 CalculNotesIsen - Documentation Technique & Développement

Ce document centralise les connaissances techniques, les règles métier et les standards du projet pour guider le développement.

## 🛠️ Stack Technique
- **Framework :** Expo (SDK 54) avec React Native.
- **Navigation :** Expo Router (File-based routing).
- **Langage :** TypeScript (Strict mode).
- **Styles :** StyleSheet standard avec un système de constantes (`constants/Colors.ts`).
- **Icônes :** `lucide-react-native`.
- **Animations :** `react-native-reanimated` et API `Animated` native.
- **Stockage :** `@react-native-async-storage/async-storage` et `expo-secure-store`.

## 📏 Règles Métier (ISEN)

### Validation des UE
Pour qu'une Unité d'Enseignement (UE) soit validée, deux conditions sont nécessaires :
1. **Moyenne de l'UE ≥ 10/20**.
2. **Aucune matière constitutive de l'UE n'a une moyenne < 6/20** (Note éliminatoire).

### Calcul des Moyennes
- **Matière :** Moyenne pondérée des évaluations selon leurs coefficients respectifs.
- **UE :** Moyenne pondérée des matières selon les coefficients de matière.
- **Semestre :** Moyenne pondérée des UE selon leurs ECTS.

## 🎨 Système de Design (Premium v2)
- **Primary :** `#2563EB` (Bleu Royal moderne).
- **Success :** `#10B981` (Vert émeraude).
- **Error :** `#F43F5E` (Rose-rouge corail).
- **Warning :** `#F59E0B` (Ambre).
- **Neutral :** `#F8FAFC` (Gris très clair pour les fonds).
- **Rayons de courbure (Border Radius) :** 
  - `24px` pour les grandes cartes principales.
  - `16px` pour les sous-sections et éléments internes.
  - `12px` pour les boutons et badges.
- **Ombres (Shadows) :** Opacité très faible (`0.02` à `0.04`) avec un rayon de diffusion large pour un effet premium et léger.
- **Typographie :** Graisses `800` pour les titres et moyennes `600/700` pour les informations clés. Espacement des lettres (`letterSpacing: -0.5`) sur les titres.

## 📂 Structure du Code
- `app/` : Routes de l'application (Navigation).
- `components/ui/` : Composants atomiques et cartes complexes.
- `services/` : Appels API (isenApi, agendaApi) et gestion du stockage.
- `utils/` : Logique pure de traitement de données (calculs de notes).
- `types/` : Définitions TypeScript globales.

## ⌨️ Standards de Code pour Gemini
1. **Typage :** Toujours définir des interfaces dans `types/` avant d'implémenter une nouvelle fonctionnalité.
2. **Surgical Updates :** Utiliser `replace` avec un contexte suffisant pour éviter les erreurs de duplication.
3. **Validation :** Après chaque changement de logique de calcul, vérifier l'impact dans `utils/notes.ts`.
4. **Performance :** Utiliser `useCallback` et `useMemo` pour les calculs lourds dans les listes de notes.
5. **Animations :** Favoriser les animations fluides pour les états de chargement et les transitions.
6. **UI Premium :** Toujours respecter le système de design v2 (arrondis généreux, ombres douces, bleu royal).

## 🔄 Flux de Données
1. Récupération des notes brutes via `isenApi.ts`.
2. Chargement de la structure de la filière (`structure_note.json`).
3. Fusion et calcul via `getDonneesAvecNotes` (`utils/notes.ts`).
4. Affichage via `UeCard` et `MatiereCard`.
