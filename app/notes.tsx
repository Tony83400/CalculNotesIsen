import React, { useCallback, useEffect, useState, useRef } from "react";
import {
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    StatusBar,
    Animated,
    Easing,
    Alert,
    ActivityIndicator
} from "react-native";
import { router } from "expo-router";
import { 
    ChevronLeft, 
    Home, 
    RotateCcw, 
    AlertCircle, 
    Loader2, 
    TrendingUp, 
    Trophy,
    Info,
    CalendarDays,
    ChevronDown,
    Check,
} from "lucide-react-native";

import { getNotes } from "@/services/isenApi";
import { 
    getId, 
    loadLastUpdateNotes, 
    getSelectedMajorsUrls,
    getSelectedMajors,
    getSelectedYear,
    getSelectedSemester,
    setSelectedSemester,
    loadSemesterStructureFromCache
} from "@/services/storage";
import { fetchSemesterStructure } from "@/services/configApi";
import { Note } from "@/types/note";
import getDonneesAvecNotes from "@/utils/notes";
import UeCard from '../components/ui/notes/UeList';
import { Colors } from "@/constants/Colors";

export default function NotesScreen() {
    const [notes, setNotes] = useState<Note[]>();
    const [selectedYear, setSelectedYear] = useState<string | null>(null);
    const [selectedSemester, setSelectedSemesterState] = useState<string | null>(null);
    const [selectedMajors, setSelectedMajors] = useState<Record<string, string>>({});
    const [majorUrls, setMajorUrls] = useState<Record<string, string>>({});
    
    const [configActuelle, setConfigActuelle] = useState<any>(null);
    const [userId, setUserId] = useState<string | null>("");
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [error, setError] = useState<string | null>(null);
    const [simulatedNotes, setSimulatedNotes] = useState<Record<string, number | null>>({});
    const [isRattrapageMode, setIsRattrapageMode] = useState(false);
    const [isLoadingConfig, setIsLoadingConfig] = useState(false);
    const [showSemesterPicker, setShowSemesterPicker] = useState(false);

    const spinValue = useRef(new Animated.Value(0)).current;

    // 1. Chargement de la configuration utilisateur
    useEffect(() => {
        const loadUserConfig = async () => {
            setIsLoadingConfig(true);
            try {
                const year = await getSelectedYear();
                const majors = await getSelectedMajors();
                const urls = await getSelectedMajorsUrls();
                const semester = await getSelectedSemester();

                if (!year || !majors || !urls || !semester) {
                    // Pas de config, redirection vers la sélection d'année
                    router.replace("/selectionAnnee");
                    return;
                }

                setSelectedYear(year);
                setSelectedMajors(majors);
                setMajorUrls(urls);
                setSelectedSemesterState(semester);

                // Charger la structure du semestre actif
                await loadStructure(semester, urls[semester], majors[semester]);
            } catch (e) {
                console.error("Error loading config:", e);
                setError("Erreur de configuration.");
            } finally {
                setIsLoadingConfig(false);
            }
        };
        loadUserConfig();
    }, []);

    // 2. Fonction de chargement de structure (Cache -> Local/Remote)
    const loadStructure = async (semester: string, url: string, majorNameOverride?: string) => {
        setIsLoadingConfig(true);
        try {
            const data = await fetchSemesterStructure(semester, url);
            if (data) {
                // Wrap pour compatibilité avec getDonneesAvecNotes
                const majorName = majorNameOverride || selectedMajors[semester] || "Filière";
                const wrappedConfig = {
                    version: "1.1",
                    filieres: {
                        [majorName]: Array.isArray(data) ? data : (data.filieres ? data.filieres[majorName] : [])
                    }
                };
                setConfigActuelle(wrappedConfig);
            } else {
                Alert.alert("Erreur", "Impossible de charger la structure du semestre.");
            }
        } catch (e) {
            console.error("Load structure error:", e);
        } finally {
            setIsLoadingConfig(false);
        }
    };

    // 3. Changement de semestre
    const handleSemesterChange = async (sem: string) => {
        if (sem === selectedSemester) return;
        
        setShowSemesterPicker(false);
        setSelectedSemesterState(sem);
        await setSelectedSemester(sem);
        await loadStructure(sem, majorUrls[sem], selectedMajors[sem]);
    };

    // --- Logique Notes & Animation ---
    
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const id = await getId();
                setUserId(id);
            } catch {
                setError("Impossible de récupérer vos identifiants.");
            }
        };
        fetchUser();
    }, []);

    const fetchNote = useCallback(async () => {
        if (!userId) return;
        setError(null);
        try {
            const rep = await getNotes();
            if (rep) {
                setNotes(rep);
                const date = await loadLastUpdateNotes();
                if (date.getTime() !== 0) {
                    setLastUpdate(date);
                }
            }
        } catch (err: any) {
            if (err.message === "Session expirée") {
                Alert.alert("Session expirée", "Votre session a expiré. Reconnexion automatique...", [
                    { text: "OK", onPress: () => router.replace("/") }
                ]);
                router.replace("/");
                return;
            }
            setError(err.message || "Une erreur est survenue lors de la récupération des notes.");
        }
    }, [userId]);

    useEffect(() => {
        fetchNote();
    }, [fetchNote]);

    useEffect(() => {
        let isCancelled = false;
        const runAnimation = () => {
            if (isCancelled) return;
            spinValue.setValue(0);
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 1200,
                easing: Easing.linear,
                useNativeDriver: true,
            }).start(({ finished }) => {
                if (finished && !isCancelled) runAnimation();
            });
        };
        if (!notes && userId !== "") runAnimation();
        return () => { isCancelled = true; spinValue.stopAnimation(); };
    }, [notes === undefined, userId]);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    const updateSimulation = useCallback((id: string, val: number | null) => {
        setSimulatedNotes(prev => ({ ...prev, [id]: val }));
    }, []);

    // --- Rendu ---

    if (isLoadingConfig && !configActuelle) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingTitle}>Chargement de la configuration...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerContainer}>
                    <View style={styles.errorIconContainer}>
                        <AlertCircle size={48} color={Colors.status.error} />
                    </View>
                    <Text style={styles.errorTitle}>Oups ! Une erreur est survenue</Text>
                    <Text style={styles.errorMessage}>{error}</Text>
                    <TouchableOpacity style={styles.primaryButton} onPress={fetchNote}>
                        <RotateCcw size={20} color="#FFF" />
                        <Text style={styles.primaryButtonText}>Réessayer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push("/")}>
                        <Home size={20} color={Colors.text.primary} />
                        <Text style={styles.secondaryButtonText}>Se reconnecter</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (!notes && userId !== "") {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerContainer}>
                    <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]}>
                        <Loader2 size={48} color={Colors.primary} />
                    </Animated.View>
                    <Text style={styles.loadingTitle}>Récupération de vos notes...</Text>
                    <Text style={styles.loadingSubtitle}>L'API de l'ISEN prend parfois un peu de temps...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const currentMajor = selectedSemester ? selectedMajors[selectedSemester] : null;
    const dataFiliere = (configActuelle?.filieres && currentMajor) ? (configActuelle.filieres[currentMajor] || []) : [];
    const resultats = getDonneesAvecNotes(dataFiliere, notes || [], simulatedNotes, isRattrapageMode);
    const donneesAffichables = resultats.structure;
    const stats = resultats.stats;
    const availableSemesters = Object.keys(selectedMajors);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            {/* Header Dynamique avec sélecteur de semestre */}
            <View style={styles.topHeader}>
                <TouchableOpacity onPress={() => router.push("/selection")} style={styles.iconBtn}>
                    <Home size={22} color={Colors.text.primary} />
                </TouchableOpacity>
                
                <View style={styles.headerTitleContainer}>
                    <TouchableOpacity 
                        style={styles.semesterToggle} 
                        onPress={() => setShowSemesterPicker(!showSemesterPicker)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.headerTitle}>{selectedSemester} - {currentMajor}</Text>
                        <ChevronDown size={16} color={Colors.text.tertiary} />
                    </TouchableOpacity>
                    <Text style={styles.headerDate}>
                        Mis à jour : {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
<TouchableOpacity onPress={() => router.replace("/agenda")} style={styles.iconBtn}>
                    <CalendarDays size={22} color={Colors.text.primary} />
                </TouchableOpacity>

                
            </View>

            {/* Menu déroulant des semestres */}
            {showSemesterPicker && (
                <View style={styles.semesterPickerMenu}>
                    {availableSemesters.map(sem => (
                        <TouchableOpacity 
                            key={sem} 
                            style={[styles.semesterPickerItem, sem === selectedSemester && styles.semesterPickerItemActive]}
                            onPress={() => handleSemesterChange(sem)}
                        >
                            <Text style={[styles.semesterPickerText, sem === selectedSemester && styles.semesterPickerTextActive]}>
                                {sem} ({selectedMajors[sem]})
                            </Text>
                            {sem === selectedSemester && <Check size={16} color={Colors.primary} />}
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            <View style={styles.infoBar}>
                <Info size={14} color={Colors.primary} />
                <Text style={styles.infoBarText}>Tapez sur une note pour simuler votre moyenne</Text>
            </View>

            <View style={styles.modeSelectorContainer}>
                <View style={styles.modeSelector}>
                    <TouchableOpacity 
                        style={[styles.modeTab, !isRattrapageMode && styles.activeModeTab]}
                        onPress={() => setIsRattrapageMode(false)}
                    >
                        <Text style={[styles.modeTabText, !isRattrapageMode && styles.activeModeTabText]}>Standard</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.modeTab, isRattrapageMode && styles.activeModeTab]}
                        onPress={() => setIsRattrapageMode(true)}
                    >
                        <Text style={[styles.modeTabText, isRattrapageMode && styles.activeModeTabText]}>Rattrapages</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={donneesAffichables}
                keyExtractor={(item, index) => item.ue || index.toString()}
                ListHeaderComponent={
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <View style={styles.statHeader}>
                                <View style={[styles.statIconContainer, { backgroundColor: Colors.primary + '10' }]}>
                                    <TrendingUp size={18} color={Colors.primary} />
                                </View>
                                <Text style={styles.statLabel}>Moyenne</Text>
                            </View>
                            <View style={styles.statValueRow}>
                                <Text style={[styles.statValue, { color: stats.moyenne >= 10 ? Colors.status.success : Colors.status.error }]}>
                                    {stats.moyenne.toFixed(2)}
                                </Text>
                                <Text style={styles.statMax}>/20</Text>
                            </View>
                        </View>
                        <View style={styles.statCard}>
                            <View style={styles.statHeader}>
                                <View style={[styles.statIconContainer, { backgroundColor: Colors.status.info + '10' }]}>
                                    <Trophy size={18} color={Colors.status.info} />
                                </View>
                                <Text style={styles.statLabel}>Crédits</Text>
                            </View>
                            <View style={styles.statValueRow}>
                                <Text style={[styles.statValue, { color: Colors.text.primary }]}>{stats.ects}</Text>
                                <Text style={styles.statMax}>/30</Text>
                            </View>
                        </View>
                    </View>
                }
                renderItem={({ item }) => (
                    <UeCard
                        Ue={item}
                        simulatedNotes={simulatedNotes}
                        updateSimulation={updateSimulation}
                    />
                )}
                contentContainerStyle={styles.listContent}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    listContent: { paddingBottom: 40 },
    topHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        zIndex: 10,
    },
    iconBtn: {
        width: 44, height: 44, borderRadius: 14,
        backgroundColor: Colors.background,
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitleContainer: { flex: 1, alignItems: 'center', paddingHorizontal: 12 },
    semesterToggle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    headerTitle: { fontSize: 15, fontWeight: '800', color: Colors.text.primary, letterSpacing: -0.3 },
    headerDate: { fontSize: 10, fontWeight: '500', color: Colors.text.tertiary, marginTop: 2 },
    semesterPickerMenu: {
        position: 'absolute', top: 70, left: 16, right: 16,
        backgroundColor: Colors.surface, borderRadius: 20,
        padding: 8, borderWidth: 1, borderColor: Colors.border,
        shadowColor: "#000", shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1, shadowRadius: 20, elevation: 10, zIndex: 100,
    },
    semesterPickerItem: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 16, borderRadius: 14,
    },
    semesterPickerItemActive: { backgroundColor: Colors.primary + '08' },
    semesterPickerText: { fontSize: 15, fontWeight: '600', color: Colors.text.secondary },
    semesterPickerTextActive: { color: Colors.primary, fontWeight: '700' },
    infoBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primaryLight, paddingVertical: 10, gap: 8 },
    infoBarText: { fontSize: 12, color: Colors.primary, fontWeight: '600', letterSpacing: -0.2 },
    modeSelectorContainer: { paddingHorizontal: 16, paddingTop: 16 },
    modeSelector: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 16, padding: 4, borderWidth: 1, borderColor: Colors.border },
    modeTab: { flex: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
    activeModeTab: { backgroundColor: Colors.primary, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    modeTabText: { fontSize: 14, fontWeight: '700', color: Colors.text.secondary },
    activeModeTabText: { color: '#FFFFFF' },
    statsRow: { flexDirection: 'row', gap: 16, padding: 16, paddingBottom: 24 },
    statCard: { flex: 1, backgroundColor: Colors.surface, padding: 16, borderRadius: 24, borderWidth: 1, borderColor: Colors.border, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 12, elevation: 2 },
    statHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    statIconContainer: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    statLabel: { fontSize: 13, color: Colors.text.secondary, fontWeight: '700' },
    statValueRow: { flexDirection: 'row', alignItems: 'baseline' },
    statValue: { fontSize: 28, fontWeight: '800', letterSpacing: -1 },
    statMax: { fontSize: 14, color: Colors.text.tertiary, fontWeight: '600', marginLeft: 2 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    spinner: { marginBottom: 24 },
    loadingTitle: { fontSize: 20, fontWeight: '800', color: Colors.text.primary, textAlign: 'center' },
    loadingSubtitle: { fontSize: 14, color: Colors.text.secondary, textAlign: 'center', marginTop: 8 },
    errorIconContainer: { width: 80, height: 80, borderRadius: 24, backgroundColor: Colors.status.error + '10', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    errorTitle: { fontSize: 22, fontWeight: '800', color: Colors.text.primary, textAlign: 'center' },
    errorMessage: { fontSize: 15, color: Colors.text.secondary, textAlign: 'center', marginTop: 12, marginBottom: 32 },
    primaryButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, paddingVertical: 16, paddingHorizontal: 24, borderRadius: 16, gap: 10, width: '100%', justifyContent: 'center' },
    primaryButtonText: { color: 'white', fontSize: 16, fontWeight: '800' },
    secondaryButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, paddingVertical: 16, paddingHorizontal: 24, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, gap: 10, width: '100%', justifyContent: 'center', marginTop: 12 },
    secondaryButtonText: { color: Colors.text.primary, fontSize: 16, fontWeight: '700' }
});