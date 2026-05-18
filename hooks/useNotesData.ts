import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { 
    getNotes,
} from "@/services/isenApi";
import { 
    getId, 
    getSelectedMajorsUrls,
    getSelectedMajors,
    getSelectedYear,
    getSelectedSemester,
    setSelectedSemester as setStorageSelectedSemester,
    loadNotesFromCache,
    getLastUpdate,
} from "@/services/storage";
import { fetchSemesterStructure } from "@/services/configApi";
import { Note } from "@/types/note";

// CACHE SESSION (Hors hook pour persister entre les navigations Agenda <-> Notes)
let sessionNotes: Note[] | undefined = undefined;
let sessionConfigs: Record<string, any> = {};
let sessionUserId: string | null = "";
let sessionUserParams: any = null;
let sessionLastUpdate: string | null = null;

export const useNotesData = () => {
    const [notes, setNotes] = useState<Note[] | undefined>(sessionNotes);
    const [lastUpdate, setLastUpdate] = useState<string | null>(sessionLastUpdate);
    const [selectedSemester, setSelectedSemesterState] = useState<string | null>(sessionUserParams?.semester || null);
    const [selectedMajors, setSelectedMajors] = useState<Record<string, string>>(sessionUserParams?.majors || {});
    const [allConfigs, setAllConfigs] = useState<Record<string, any>>(sessionConfigs);
    const [userId, setUserId] = useState<string | null>(sessionUserId);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(!sessionNotes || Object.keys(sessionConfigs).length === 0);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        const loadInitialData = async () => {
            const [year, majors, urls, semester, id, lastUp] = await Promise.all([
                getSelectedYear(),
                getSelectedMajors(),
                getSelectedMajorsUrls(),
                getSelectedSemester(),
                getId(),
                getLastUpdate()
            ]);

            if (!year || !majors || !urls || !semester) {
                router.replace("/selectionAnnee");
                return;
            }

            if (id && sessionUserId && id !== sessionUserId) {
                sessionNotes = undefined;
                sessionConfigs = {};
                sessionUserParams = null;
                sessionLastUpdate = null;
            }

            const userParams = { year, majors, urls, semester };
            sessionUserParams = userParams;
            sessionUserId = id;
            sessionLastUpdate = lastUp;
            
            setSelectedMajors(majors);
            setSelectedSemesterState(semester);
            setUserId(id);
            setLastUpdate(lastUp);

            let currentNotes = sessionNotes;
            if (!currentNotes) {
                currentNotes = await loadNotesFromCache() || undefined;
                if (currentNotes) {
                    sessionNotes = currentNotes;
                    setNotes(currentNotes);
                }
            }

            if (!currentNotes) {
                setIsLoading(true);
            } else {
                setIsLoading(false);
            }

            try {
                const configPromises = Object.entries(urls).map(async ([sem, url]) => {
                    const data = await fetchSemesterStructure(sem, url);
                    const majorName = majors[sem] || "Filière";
                    return {
                        sem,
                        config: {
                            filieres: {
                                [majorName]: Array.isArray(data) ? data : (data.filieres ? data.filieres[majorName] : [])
                            }
                        }
                    };
                });

                const loadedConfigs = await Promise.all(configPromises);
                const configsObj: Record<string, any> = {};
                loadedConfigs.forEach(item => {
                    configsObj[item.sem] = item.config;
                });
                
                sessionConfigs = configsObj;
                setAllConfigs(configsObj);

                if (id) {
                    setIsRefreshing(true);
                    const rep = await getNotes();
                    if (rep) {
                        sessionNotes = rep;
                        setNotes(rep);
                        const newLastUp = await getLastUpdate();
                        sessionLastUpdate = newLastUp;
                        setLastUpdate(newLastUp);
                    }
                    setIsRefreshing(false);
                }
            } catch (e: any) {
                console.error("Error loading notes screen:", e);
                setIsRefreshing(false);
                if (!sessionNotes && !currentNotes) {
                    setError(e.message || "Erreur de chargement.");
                }
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, []);

    const handleSemesterChange = async (sem: string) => {
        if (sem === selectedSemester) return;
        setSelectedSemesterState(sem);
        if (sessionUserParams) sessionUserParams.semester = sem;
        await setStorageSelectedSemester(sem);
    };

    const fetchNotes = useCallback(async () => {
        if (!userId) return;
        setError(null);
        setIsRefreshing(true);
        try {
            const rep = await getNotes();
            if (rep) {
                sessionNotes = rep;
                setNotes(rep);
                const newLastUp = await getLastUpdate();
                sessionLastUpdate = newLastUp;
                setLastUpdate(newLastUp);
            }
        } catch (err: any) {
            if (err.message === "Session expirée") {
                router.replace("/");
                return;
            }
            if (notes) {
                Alert.alert("Erreur", err.message || "Impossible de mettre à jour les notes.");
            } else {
                setError(err.message || "Une erreur est survenue.");
            }
        } finally {
            setIsRefreshing(false);
        }
    }, [userId, notes]);

    return {
        notes,
        lastUpdate,
        selectedSemester,
        selectedMajors,
        allConfigs,
        userId,
        error,
        isLoading,
        isRefreshing,
        handleSemesterChange,
        fetchNotes
    };
};
