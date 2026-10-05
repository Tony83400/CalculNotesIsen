import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AgendaEvent } from "@/types/agenda";
import { parseAgenda } from "@/utils/agenda";

export interface RecentUser {
    id: string;
    prenom: string;
    nom: string;
}

export interface MultiAgendaUser {
    id: string; // prenom.nom
    prenom: string;
    nom: string;
    color: string;
}

const MULTI_USERS_KEY = "@multi_agenda_users";
const RECENT_USERS_KEY = "@recent_multi_users";

// Palette de couleurs pour différencier les utilisateurs (16 couleurs)
const USER_COLORS = [
    "#2563EB", // Bleu Royal
    "#10B981", // Vert Emeraude
    "#F43F5E", // Rouge Corail
    "#F59E0B", // Orange Doré
    "#8B5CF6", // Violet
    "#EC4899", // Rose
    "#14B8A6", // Sarcelle (Teal)
    "#06B6D4", // Cyan
    "#3B82F6", // Bleu Clair
    "#84CC16", // Citron Vert
    "#F97316", // Orange Vif
    "#D946EF", // Fuchsia
    "#6366F1", // Indigo
    "#0EA5E9", // Bleu Ciel
    "#EAB308", // Jaune Moutarde
    "#64748B", // Gris Ardoise
];

export function useMultiAgenda() {
    const [users, setUsers] = useState<MultiAgendaUser[]>([]);
    const [allEvents, setAllEvents] = useState<AgendaEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
    const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
    const eventsCache = useRef<Record<string, AgendaEvent[]>>({});

    // Mêmes logiques de date que useAgenda
    const [currentDay, setCurrentDay] = useState<Date>(() => {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - (day === 0 ? 6 : day - 1);
        const monday = new Date(now);
        monday.setDate(diff);
        monday.setHours(0, 0, 0, 0);
        return monday; 
    });

    const [selectedDate, setSelectedDate] = useState<Date>(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    });

    const endOfWeek = useMemo(() => {
        const end = new Date(currentDay);
        end.setDate(currentDay.getDate() + 5);
        return end;
    }, [currentDay]);

    // Chargement initial des utilisateurs sauvegardés
    useEffect(() => {
        const loadSavedUsers = async () => {
            try {
                let loadedUsers = [];
                const stored = await AsyncStorage.getItem(MULTI_USERS_KEY);
                if (stored) {
                    loadedUsers = JSON.parse(stored);
                    setUsers(loadedUsers);
                }
                const storedRecents = await AsyncStorage.getItem(RECENT_USERS_KEY);
                if (storedRecents) {
                    setRecentUsers(JSON.parse(storedRecents));
                }
                
                if (loadedUsers.length === 0) {
                    setLoading(false);
                }
            } catch (e) {
                console.error("Erreur chargement utilisateurs multi agenda", e);
                setLoading(false);
            }
        };
        loadSavedUsers();
    }, []);

    // Sauvegarde des utilisateurs
    const saveUsers = async (newUsers: MultiAgendaUser[]) => {
        try {
            await AsyncStorage.setItem(MULTI_USERS_KEY, JSON.stringify(newUsers));
            setUsers(newUsers);
        } catch (e) {
            console.error("Erreur sauvegarde utilisateurs multi agenda", e);
        }
    };

    const addUser = async (prenom: string, nom: string) => {
        const cleanPrenom = prenom.trim().toLowerCase();
        const cleanNom = nom.trim().toLowerCase();
        const id = `${cleanPrenom.replace(/[\s']+/g, '-')}.${cleanNom.replace(/[\s']+/g, '-')}`;

        setUsers(prevUsers => {
            if (prevUsers.find(u => u.id === id)) return prevUsers;
            
            const usedColors = prevUsers.map(u => u.color);
            const availableColors = USER_COLORS.filter(c => !usedColors.includes(c));
            const color = availableColors.length > 0 ? availableColors[0] : USER_COLORS[prevUsers.length % USER_COLORS.length];
            
            const newUser: MultiAgendaUser = { id, prenom: cleanPrenom, nom: cleanNom, color };
            const newUsers = [...prevUsers, newUser];
            
            AsyncStorage.setItem(MULTI_USERS_KEY, JSON.stringify(newUsers));
            fetchAgendas(newUsers); 
            
            return newUsers;
        });
    };

    const removeUser = async (id: string) => {
        setUsers(prevUsers => {
            const newUsers = prevUsers.filter(u => u.id !== id);
            AsyncStorage.setItem(MULTI_USERS_KEY, JSON.stringify(newUsers));
            
            delete eventsCache.current[id];
            combineAndSetEvents(newUsers, eventsCache.current);
            
            return newUsers;
        });
    };

    const removeRecentUser = async (id: string) => {
        const newRecents = recentUsers.filter(u => u.id !== id);
        setRecentUsers(newRecents);
        await AsyncStorage.setItem(RECENT_USERS_KEY, JSON.stringify(newRecents));
    };
    
    const combineAndSetEvents = (currentUsers: MultiAgendaUser[], cache: Record<string, AgendaEvent[]>) => {
        let combined: AgendaEvent[] = [];
        currentUsers.forEach(u => {
            if (cache[u.id]) {
                combined.push(...cache[u.id]);
            }
        });
        combined.sort((a, b) => a.start.getTime() - b.start.getTime());
        setAllEvents(combined);
    };

    const fetchAgendas = useCallback(async (currentUsers = users) => {
        if (currentUsers.length === 0) {
            setAllEvents([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        setSearchError(null);
        const failedUsers: MultiAgendaUser[] = [];

        try {
            const usersToFetch = currentUsers.filter(u => !eventsCache.current[u.id]);
            
            // Requêtes en parallèle pour les utilisateurs non en cache
            const promises = usersToFetch.map(async (user) => {
                const apiPrenom = user.prenom.replace(/[\s']+/g, '-');
                const apiNom = user.nom.replace(/[\s']+/g, '-');

                const res = await fetch(
                    `https://calcul-notes-isen.vercel.app/api/calendar?prenom=${apiPrenom}&nom=${apiNom}`,
                    {
                        method: "GET",
                        headers: { Accept: "text/calendar" }
                    }
                );
                
                if (!res.ok) {
                    failedUsers.push(user);
                    return [];
                }
                
                const icsString = await res.text();
                if (!icsString.includes("BEGIN:VCALENDAR")) {
                    failedUsers.push(user);
                    return [];
                }

                const events = parseAgenda(icsString);
                
                // Ajouter une propriété custom pour la couleur et l'utilisateur sur chaque event
                return events.map(e => ({
                    ...e,
                    color: user.color,
                    userName: `${user.prenom} ${user.nom}`
                }));
            });

            const results = await Promise.all(promises);
            
            results.forEach((userEvents, index) => {
                const user = usersToFetch[index];
                if (userEvents.length > 0) {
                    eventsCache.current[user.id] = userEvents;
                }
            });

            let finalUsers = currentUsers;
            if (failedUsers.length > 0) {
                const failedNames = failedUsers.map(u => `${u.prenom} ${u.nom}`).join(', ');
                setSearchError(`Agenda introuvable pour : ${failedNames}`);
                
                finalUsers = currentUsers.filter(u => !failedUsers.find(f => f.id === u.id));
                setUsers(finalUsers);
                await AsyncStorage.setItem(MULTI_USERS_KEY, JSON.stringify(finalUsers));
            }
            
            // Ajouter aux récents les utilisateurs qui ont fonctionné
            const newValidUsers = usersToFetch.filter(u => !failedUsers.find(f => f.id === u.id));
            if (newValidUsers.length > 0) {
                setRecentUsers(prev => {
                    let updated = [...prev];
                    newValidUsers.forEach(nu => {
                        updated = updated.filter(ru => ru.id !== nu.id);
                        updated.unshift({ id: nu.id, prenom: nu.prenom, nom: nu.nom });
                    });
                    updated = updated.slice(0, 10);
                    AsyncStorage.setItem(RECENT_USERS_KEY, JSON.stringify(updated));
                    return updated;
                });
            }

            combineAndSetEvents(finalUsers, eventsCache.current);
        } catch (err: any) {
            console.error("Erreur fetchAgendas multiples:", err);
            setError("Impossible de charger certains agendas.");
        } finally {
            setLoading(false);
        }
    }, [users]);

    useEffect(() => {
        if (users.length > 0) {
            fetchAgendas();
        }
    }, [users.length]); // Seulement au montage ou quand le nombre change, car fetchAgendas gère le contenu

    const weekEvents = useMemo(() => {
        const startWeek = new Date(currentDay);
        const endWeek = new Date(currentDay);
        endWeek.setDate(endWeek.getDate() + 6);
        endWeek.setHours(23, 59, 59, 999);

        return allEvents.filter(event => 
            event.start >= startWeek && event.start <= endWeek
        );
    }, [allEvents, currentDay]);

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
        users,
        addUser,
        removeUser,
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
        refresh: () => fetchAgendas(users),
        searchError,
        setSearchError,
        recentUsers,
        removeRecentUser
    };
}
