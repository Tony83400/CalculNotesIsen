import { Platform } from "react-native";
export const API_URL =
  Platform.OS === "web"
    ? "/api-proxy"
    : "https://api-ent.isenengineering.fr/v1";
export const CALENDAR_URL =
  Platform.OS === "web"
    ? "/api/calendar"
    : "https://calcul-notes-isen.vercel.app/api/calendar";
