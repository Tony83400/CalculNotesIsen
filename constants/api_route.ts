// constants/api_route.ts

import { Platform } from 'react-native';

// Si on est sur le web, on passe par le proxy Vercel (/api-proxy)
// Si on est sur mobile, on garde l'URL directe (car le mobile n'a pas de problème CORS)
export const API_URL = Platform.OS === 'web'
    ? '/api-proxy'
    : 'https://api-ent.isenengineering.fr/v1';