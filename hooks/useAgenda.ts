import { useState, useEffect, useCallback, useMemo } from "react";
import { getAgendaIsen } from "@/services/agendaApi";
import { AgendaEvent } from "@/types/agenda";
import { programmerNotifications } from "@/utils/notifications";
import { router } from "expo-router";
import { loadAgendaFromCache } from "@/services/storage";

export function useAgenda() {
    const [allEvents, setAllEvents] = useState<AgendaEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
    
    // État du Lundi de la semaine affichée
    const [currentDay, setCurrentDay] = useState<Date>(() => {
        const now = new Date();
        const day = now.getDay();
        // Calcul du décalage pour atteindre le lundi (1)
        // Si on est dimanche (0), on recule de 6 jours, sinon on recule de (day - 1)
        const diff = now.getDate() - (day === 0 ? 6 : day - 1);
        const monday = new Date(now);
        monday.setDate(diff);
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
        // 1. Chargement immédiat du cache
        const cached = await loadAgendaFromCache();
        if (cached && cached.length > 0) {
            setAllEvents(cached);
            setLoading(false); // On peut déjà afficher
        } else {
            setLoading(true);
        }
        
        setError(null);
        try {
            // 2. Fetch en arrière-plan
            const data = await getAgendaIsen();
            if (data) {
                setAllEvents(data);
                programmerNotifications(data);
            }
        } catch (err: any) {
            console.error("Erreur useAgenda:", err);
            if (err.message === "Session expirée") {
                router.replace("/");
                return;
            }
            // 3. Échec silencieux si on a déjà des données en cache
            if (!cached || cached.length === 0) {
                setError("Impossible de charger l'agenda.");
            }
        } finally {
            setLoading(false);
        }
    }, []);

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