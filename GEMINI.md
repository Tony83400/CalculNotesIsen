# 🎨 Guide de Refonte UI/UX - CalculNotesIsen

Ce document sert de référence pour la refonte complète de l'interface utilisateur. L'objectif est de passer d'une application utilitaire à une expérience premium, fluide et professionnelle.

## 🏛️ Vision du Design
- **Style :** Minimaliste moderne (inspiré de Linear, Apple Health, et Vercel).
- **Atmosphère :** Propre, aérée, fiable.
- **Utilisabilité :** Hiérarchie visuelle claire, micro-interactions subtiles, feedback haptique.

## 🎨 Système de Design

### Couleurs (Pro Palette)
| Usage | Hex | Description |
| :--- | :--- | :--- |
| **Primary** | `#4F46E5` | Indigo ISEN (moderne) |
| **Success** | `#10B981` | Vert émeraude pour les bonnes notes |
| **Warning** | `#F59E0B` | Ambre pour les moyennes limites |
| **Danger** | `#EF4444` | Rouge corail pour les échecs |
| **Background** | `#F9FAFB` | Gris très clair (Ne pas utiliser le blanc pur partout) |
| **Surface** | `#FFFFFF` | Blanc pour les cartes et composants |
| **Text Primary**| `#111827` | Gris ardoise foncé |
| **Text Secondary**| `#6B7280` | Gris moyen pour les labels |

### Typographie
- **Titres :** `Inter-Bold` ou `System-Bold`. Espacement serré.
- **Corps :** `Inter-Regular`. Taille minimum 14pt pour la lisibilité.
- **Chiffres (Notes) :** Utiliser une police mono ou très lisible pour les moyennes.

### Composants & Rayons
- **Bordures :** `12px` pour les cartes, `8px` pour les boutons.
- **Ombres :** `Shadow-sm` (subtile) pour détacher les cartes du fond. Pas d'ombres portées agressives.
- **Espacement (Padding) :** Minimum `16px` sur les bords d'écran.

## 🛠️ Directives de Refonte par Écran

### 1. Navigation & Layout
- Utiliser `Expo Router` avec des transitions fluides.
- Tab bar avec des icônes fines (`lucide-react-native`).
- Remplacer les boutons classiques par des surfaces tactiles élégantes.

### 2. Écran Notes (`app/notes.tsx`)
- **UE Card :** Design rétractable avec un indicateur de progression (barre fine).
- **Matière Card :** Affichage de la note en gros à droite, intitulé à gauche.
- **Badges :** Utiliser des badges pastels (`bg-opacity-10`) pour les coefficients.

### 3. Écran Agenda (`app/agenda.tsx`)
- Vue liste verticale type "Timeline".
- Indicateur de cours actuel avec une bordure gauche colorée (`Primary`).
- Squelettes de chargement (`Skeleton screens`) à la place des spinners.

## 🚀 Règles de Développement pour Gemini
- **Accessibilité :** Contraste élevé obligatoire, support du Mode Sombre (Dark Mode).
- **Performance :** Utiliser `FlashList` pour les longues listes de notes.
- **Icônes :** Utiliser uniquement `lucide-react-native`.
- **Atomic Design :** Créer des composants réutilisables dans `components/ui/`.

## 📌 Roadmap de la Refonte
1. [ ] Mise à jour des constantes de couleurs (`constants/Colors.ts`).
2. [ ] Refonte des composants de base (`CourseCard`, `MatiereCard`).
3. [ ] Implémentation du nouveau layout global.
4. [ ] Ajout de micro-animations avec `moti` ou `react-native-reanimated`.
