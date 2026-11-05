import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { AgendaEvent } from "../types/agenda";
import { formatTime } from "./agenda";
import { getStorageItem, setStorageItem } from "../services/storage/base";
import { getDataGeneration } from "../services/dataScope";
let sequence = 0;
if (Platform.OS !== "web")
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
export async function cancelCourseNotifications() {
  sequence++;
  if (Platform.OS !== "web")
    await Notifications.cancelAllScheduledNotificationsAsync();
}
export const notificationsEnabled = async () =>
  (await getStorageItem("Notifications")) === "true";
export async function setNotificationsEnabled(enabled: boolean) {
  if (Platform.OS === "web") return false;
  if (enabled) {
    if (Platform.OS === "android")
      await Notifications.setNotificationChannelAsync("cours-rappel", {
        name: "Rappels de cours",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    const p = await Notifications.requestPermissionsAsync();
    if (p.status !== "granted") return false;
  }
  await setStorageItem("Notifications", String(enabled));
  if (!enabled) await cancelCourseNotifications();
  return enabled;
}
export async function programmerNotifications(events: AgendaEvent[]) {
  if (Platform.OS === "web" || !(await notificationsEnabled())) return;
  const own = ++sequence,
    g = getDataGeneration();
  const current = () => own === sequence && g === getDataGeneration();
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (!current()) return;
    const now = Date.now(),
      end = now + 4 * 86400000;
    const upcoming = events
      .filter((e) => +e.start - 1800000 > now && +e.start < end)
      .sort((a, b) => +a.start - +b.start)
      .slice(0, 50);
    for (const event of upcoming) {
      if (!current()) return;
      const identifier = await Notifications.scheduleNotificationAsync({
        identifier: `course:${event.id}`,
        content: {
          title: `${event.isExam ? "Examen" : "Cours"} · ${event.title}`,
          body: `${formatTime(event.start)} · ${event.location}`,
          data: { eventId: event.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(+event.start - 1800000),
          channelId: "cours-rappel",
        },
      });
      if (!current()) {
        await Notifications.cancelScheduledNotificationAsync(identifier);
        return;
      }
    }
  } catch {
    /* Permission or device service unavailable; the schedule remains usable. */
  }
}
export default programmerNotifications;
