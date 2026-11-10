import { useState, useMemo, useCallback } from "react";
import { useAppData } from "../providers/AppData";
import { AgendaEvent } from "../types/agenda";

export function useAgenda() {
  const app = useAppData();
  const [viewMode, setViewMode] = useState<"week" | "day">("week");

  // État du Lundi de la semaine affichée
  const [currentDay, setCurrentDay] = useState<Date>(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - (day === 0 ? 6 : day - 1);
    const m = new Date(now);
    m.setDate(diff);
    m.setHours(0, 0, 0, 0);
    return m;
  });

  // État du jour sélectionné (mode jour)
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  // Fin de la semaine affichée (Samedi)
  const endOfWeek = useMemo(() => {
    const end = new Date(currentDay);
    end.setDate(currentDay.getDate() + 5);
    return end;
  }, [currentDay]);

  const allEvents = app.agenda.data;

  // Filtrage des événements pour la semaine
  const weekEvents = useMemo(() => {
    const startWeek = new Date(currentDay);
    const endWeek = new Date(currentDay);
    endWeek.setDate(endWeek.getDate() + 6);
    endWeek.setHours(23, 59, 59, 999);

    return allEvents.filter(
      (event) => event.start >= startWeek && event.start <= endWeek,
    );
  }, [allEvents, currentDay]);

  // Navigation
  const changeDate = useCallback(
    (offset: number) => {
      if (viewMode === "week") {
        setCurrentDay((prev) => {
          const newDate = new Date(prev);
          newDate.setDate(newDate.getDate() + offset);
          return newDate;
        });
      } else {
        setSelectedDate((prev) => {
          const newDate = new Date(prev);
          newDate.setDate(newDate.getDate() + offset);

          const day = newDate.getDay();
          const diff = newDate.getDate() - day + (day === 0 ? -6 : 1);
          const m = new Date(newDate);
          m.setDate(diff);
          m.setHours(0, 0, 0, 0);

          if (m.getTime() !== currentDay.getTime()) {
            setCurrentDay(m);
          }

          return newDate;
        });
      }
    },
    [viewMode, currentDay],
  );

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => {
      const newMode = prev === "week" ? "day" : "week";

      if (newMode === "day") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startWeek = new Date(currentDay);
        const endWeek = new Date(currentDay);
        endWeek.setDate(endWeek.getDate() + 6);

        if (today >= startWeek && today <= endWeek) {
          setSelectedDate(today);
        } else {
          setSelectedDate(new Date(currentDay));
        }
      }
      return newMode;
    });
  }, [currentDay]);

  const goToToday = useCallback(() => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const day = now.getDay();
    const diff = now.getDate() - (day === 0 ? 6 : day - 1);
    const m = new Date(now);
    m.setDate(diff);
    m.setHours(0, 0, 0, 0);

    setCurrentDay(m);
    setSelectedDate(today);
  }, []);

  return {
    allEvents,
    weekEvents,
    loading: !app.ready || app.agenda.status === "loading",
    error: app.agenda.error,
    viewMode,
    currentDay,
    selectedDate,
    endOfWeek,
    changeDate,
    goToToday,
    toggleViewMode,
    refresh: app.refresh,
  };
}
