import { Platform } from 'react-native';

// Fonction utilitaire pour détecter localhost proprement
const isLocalhost =
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const API_URL =
    Platform.OS === 'web' && !isLocalhost
        ? '/api-proxy'                           // Web en Production (Vercel) -> On passe par le proxy
        : 'https://api-ent.isenengineering.fr/v1'; // Mobile OU Localhost -> URL directe