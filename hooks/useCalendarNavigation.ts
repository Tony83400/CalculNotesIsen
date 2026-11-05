import { useState } from "react";
import { useWindowDimensions } from "react-native";
import { addDays, dayStart, monday } from "../utils/agenda";
export function useCalendarNavigation({ allowWeekOnMobile = false } = {}) {
  const { width } = useWindowDimensions();
  const [date, setDate] = useState(() => dayStart(new Date()));
  const [preference, setPreference] = useState<"day" | "week" | null>(null);
  const viewMode =
    width < 700 && !allowWeekOnMobile
      ? "day"
      : preference || (width < 700 ? "day" : "week");
  return {
    viewMode,
    currentDay: monday(date),
    selectedDate: date,
    endOfWeek: addDays(monday(date), 6),
    changeDate: (offset: number) => setDate((d) => addDays(d, offset)),
    setViewMode: (mode: "day" | "week") => setPreference(mode),
    toggleViewMode: () => setPreference(viewMode === "week" ? "day" : "week"),
    today: () => setDate(dayStart(new Date())),
  };
}
