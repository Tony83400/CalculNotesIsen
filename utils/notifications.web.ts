// Keep native notification modules and their listeners out of the web bundle.
import type { AgendaEvent } from "../types/agenda";
export async function cancelCourseNotifications() {}
export async function notificationsEnabled() {
  return false;
}
export async function setNotificationsEnabled(_enabled: boolean) {
  void _enabled;
  return false;
}
export async function programmerNotifications(_events: AgendaEvent[]) {
  void _events;
}
export default programmerNotifications;
