export const Colors = {
  // Une seule couleur primaire pour toute l'app (au lieu de mélanger #007AFF, #2563EB, #3182CE)
  primary: '#2563EB', 
  primaryLight: '#EFF6FF', // Pour les badges ou fonds légers

  // Fonds harmonisés
  background: '#F2F5F8', // Un gris bleuté moderne (remplace le #f5f5f5 et #F7F9FC)
  surface: '#FFFFFF',    // Cartes et éléments blancs

  // Textes
  text: {
    primary: '#111827',   // Noir doux pour les titres
    secondary: '#6B7280', // Gris pour les sous-titres
    tertiary: '#9CA3AF',  // Gris clair pour les infos peu importantes
    inverse: '#FFFFFF',   // Texte sur fond bleu
  },

  // Status (Notes, Validation)
  status: {
    success: '#10B981', // Vert moderne (plus doux que #4CAF50)
    warning: '#F59E0B', // Orange
    error: '#EF4444',   // Rouge
    info: '#3B82F6',    // Bleu info
    neutral: '#E5E7EB', // Gris neutre (notes manquantes)
  },

  // Bordures et séparateurs
  border: '#E5E7EB',
};