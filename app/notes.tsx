import React, { useCallback, useState } from "react";
import {
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    StatusBar,
    Animated
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { 
    Home, 
    AlertCircle, 
    Loader2, 
    TrendingUp, 
    Trophy,
    Info,
    CalendarDays,
    ChevronDown,
    Check,
} from "lucide-react-native";

import { 
    isTokenExpired,
    canSilentLogin,
} from "@/services/storage";
import getDonneesAvecNotes from "@/utils/notes";
import UeCard from '../components/ui/notes/UeList';
import { Colors } from "@/constants/Colors";
import { useNotesData } from "@/hooks/useNotesData";
import { useSpinAnimation } from "@/hooks/useSpinAnimation";

export default function NotesScreen() {
    const {
        notes,
        lastUpdate,
        selectedSemester,
        selectedMajors,
        allConfigs,
        error,
        isLoading,
        isRefreshing,
        handleSemesterChange,
    } = useNotesData();

    const [simulatedNotes, setSimulatedNotes] = useState<Record<string, number | null>>({});
    const [isRattrapageMode, setIsRattrapageMode] = useState(false);
    const [showSemesterPicker, setShowSemesterPicker] = useState(false);

    const spin = useSpinAnimation(isLoading, 1200);
    const refreshSpin = useSpinAnimation(isRefreshing, 1000);

    useFocusEffect(
        React.useCallback(() => {
            const checkSession = async () => {
                const expired = await isTokenExpired();
                const canSilent = await canSilentLogin();
                if (expired && !canSilent) {
                    router.replace("/");
                }
            };
            checkSession();
        }, [])
    );

    const updateSimulation = useCallback((id: string, val: number | null) => {
        setSimulatedNotes(prev => ({ ...prev, [id]: val }));
    }, []);

    // --- Rendu ---

    if (error && !notes) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerContainer}>
                    <AlertCircle size={48} color={Colors.status.error} />
                    <Text style={styles.errorTitle}>Erreur de chargement</Text>
                    <Text style={styles.errorMessage}>{error}</Text>
                    <TouchableOpacity style={styles.primaryButton} onPress={() => router.push("/")}>
                        <Home size={20} color="#FFF" />
                        <Text style={styles.primaryButtonText}>Retour à l'accueil</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (isLoading && !notes) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerContainer}>
                    <Animated.View style={{ transform: [{ rotate: spin }] }}>
                        <Loader2 size={48} color={Colors.primary} />
                    </Animated.View>
                    <Text style={styles.loadingTitle}>Récupération de vos notes...</Text>
                    <Text style={styles.loadingSubtitle}>Initialisation de votre cursus en cours</Text>
                </View>
            </SafeAreaView>
        );
    }

    const currentMajor = selectedSemester ? selectedMajors[selectedSemester] : null;
    const configActuelle = selectedSemester ? allConfigs[selectedSemester] : null;
    const dataFiliere = (configActuelle?.filieres && currentMajor) ? (configActuelle.filieres[currentMajor] || []) : [];
    const resultats = getDonneesAvecNotes(dataFiliere, notes || [], simulatedNotes, isRattrapageMode);
    const donneesAffichables = resultats.structure;
    const stats = resultats.stats;
    const availableSemesters = Object.keys(selectedMajors);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
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
                </View>
                <TouchableOpacity onPress={() => router.replace("/agenda")} style={styles.iconBtn}>
                    <CalendarDays size={22} color={Colors.text.primary} />
                </TouchableOpacity>
            </View>

            {showSemesterPicker && (
                <View style={styles.semesterPickerMenu}>
                    {availableSemesters.map(sem => (
                        <TouchableOpacity 
                            key={sem} 
                            style={[styles.semesterPickerItem, sem === selectedSemester && styles.semesterPickerItemActive]}
                            onPress={() => {
                                handleSemesterChange(sem);
                                setShowSemesterPicker(false);
                            }}
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

            <View style={styles.refreshIndicatorContainer}>
                <View style={styles.refreshInfoLeft}>
                    {isRefreshing ? (
                        <View style={styles.refreshingRow}>
                            <Animated.View style={{ transform: [{ rotate: refreshSpin }] }}>
                                <Loader2 size={14} color={Colors.text.tertiary} />
                            </Animated.View>
                            <Text style={styles.refreshText}>Actualisation...</Text>
                        </View>
                    ) : (
                        <View style={styles.refreshingRow}>
                            <Check size={14} color={Colors.status.success} />
                            <Text style={styles.refreshText}>À jour</Text>
                        </View>
                    )}
                </View>
                {lastUpdate && (
                    <Text style={styles.lastUpdateText}>MàJ : {lastUpdate}</Text>
                )}
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
    refreshIndicatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 4,
    },
    refreshInfoLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    refreshingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    refreshText: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    lastUpdateText: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.text.tertiary,
    },
    statsRow: { flexDirection: 'row', gap: 16, padding: 16, paddingBottom: 24 },
    statCard: { flex: 1, backgroundColor: Colors.surface, padding: 16, borderRadius: 24, borderWidth: 1, borderColor: Colors.border, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 12, elevation: 2 },
    statHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
    statIconContainer: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    statLabel: { fontSize: 13, color: Colors.text.secondary, fontWeight: '700' },
    statValueRow: { flexDirection: 'row', alignItems: 'baseline' },
    statValue: { fontSize: 28, fontWeight: '800', letterSpacing: -1 },
    statMax: { fontSize: 14, color: Colors.text.tertiary, fontWeight: '600', marginLeft: 2 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    loadingTitle: { fontSize: 20, fontWeight: '800', color: Colors.text.primary, textAlign: 'center', marginTop: 24 },
    loadingSubtitle: { fontSize: 14, color: Colors.text.secondary, textAlign: 'center', marginTop: 8 },
    errorTitle: { fontSize: 22, fontWeight: '800', color: Colors.text.primary, textAlign: 'center', marginTop: 24 },
    errorMessage: { fontSize: 15, color: Colors.text.secondary, textAlign: 'center', marginTop: 12, marginBottom: 32 },
    primaryButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, paddingVertical: 16, paddingHorizontal: 24, borderRadius: 16, gap: 10, width: '100%', justifyContent: 'center' },
    primaryButtonText: { color: 'white', fontSize: 16, fontWeight: '800' },
});