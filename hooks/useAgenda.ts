import { useAppData } from "../providers/AppData";
import { useCalendarNavigation } from "./useCalendarNavigation";
export function useAgenda() {
  const app = useAppData();
  const nav = useCalendarNavigation();
  return {
    ...nav,
    allEvents: app.agenda.data,
    weekEvents: app.agenda.data,
    loading: !app.ready || app.agenda.status === "loading",
    error: app.agenda.error,
    refresh: app.refresh,
  };
}
