import { useState, useEffect, useCallback, useMemo } from "react";
import { getAgendaIsen } from "@/services/agendaApi";
import { AgendaEvent } from "@/types/agenda";
import programmerNotifications from "@/utils/notifiations";

export function useAgenda() {
    const [allEvents, setAllEvents] = useState<AgendaEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
    
    // État du Lundi de la semaine affichée
    const [currentDay, setCurrentDay] = useState<Date>(() => {
        const startweek = new Date();
        const day = startweek.getDay();
        const diff = startweek.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(startweek);
        monday.setHours(0, 0, 0, 0);
        return monday; 
    });

    // État du jour sélectionné (mode jour)
    const [selectedDate, setSelectedDate] = useState<Date>(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    });

    // Calcul de la fin de semaine (Samedi)
    const endOfWeek = useMemo(() => {
        const end = new Date(currentDay);
        end.setDate(currentDay.getDate() + 5);
        return end;
    }, [currentDay]);

    // Récupération des données
    const fetchAgenda = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getAgendaIsen();
            setAllEvents(data);
            
            // Notification logic (optionnel : peut être déplacé ailleurs si besoin)
            const startWeek = new Date(currentDay);
            const endWeek = new Date(currentDay);
            endWeek.setDate(endWeek.getDate() + 6);
            endWeek.setHours(23, 59, 59, 999);

            const filteredForNotif = data.filter(event => 
                event.start >= startWeek && event.start <= endWeek
            );

            const tempAgenda: {day: string, events: AgendaEvent[]}[] = [];
            for (let i = 0; i < 6; i++) {
                const d = new Date(currentDay);
                d.setDate(d.getDate() + i);
                const dayEvents = filteredForNotif.filter(e => e.start.toDateString() === d.toDateString());
                tempAgenda.push({ day: d.toDateString(), events: dayEvents });
            }
            programmerNotifications(tempAgenda);
        } catch (err) {
            console.error("Erreur useAgenda:", err);
            setError("Impossible de charger l'agenda.");
        } finally {
            setLoading(false);
        }
    }, [currentDay]);

    useEffect(() => {
        fetchAgenda();
    }, [fetchAgenda]);

    // Filtrage des événements pour la semaine (pour AgendaGrid)
    const weekEvents = useMemo(() => {
        const startWeek = new Date(currentDay);
        const endWeek = new Date(currentDay);
        endWeek.setDate(endWeek.getDate() + 6);
        endWeek.setHours(23, 59, 59, 999);

        return allEvents.filter(event => 
            event.start >= startWeek && event.start <= endWeek
        );
    }, [allEvents, currentDay]);

    // Navigation
    const changeDate = useCallback((offset: number) => {
        if (viewMode === 'week') {
            setCurrentDay(prev => {
                const newDate = new Date(prev);
                newDate.setDate(newDate.getDate() + offset);
                return newDate;
            });
        } else {
            setSelectedDate(prev => {
                const newDate = new Date(prev);
                newDate.setDate(newDate.getDate() + offset);
                
                // Synchronisation auto du lundi si on change de semaine en mode jour
                const day = newDate.getDay();
                const diff = newDate.getDate() - day + (day === 0 ? -6 : 1);
                const monday = new Date(newDate);
                monday.setDate(diff);
                monday.setHours(0, 0, 0, 0);
                
                if (monday.getTime() !== currentDay.getTime()) {
                    setCurrentDay(monday);
                }
                
                return newDate;
            });
        }
    }, [viewMode, currentDay]);

    const toggleViewMode = useCallback(() => {
        setViewMode(prev => {
            const newMode = prev === 'week' ? 'day' : 'week';
            
            if (newMode === 'day') {
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

    return {
        allEvents,
        weekEvents,
        loading,
        error,
        viewMode,
        currentDay,
        selectedDate,
        endOfWeek,
        changeDate,
        toggleViewMode,
        refresh: fetchAgenda
    };
}