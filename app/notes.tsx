import React, { useCallback, useEffect, useState, useRef } from "react";
import {
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    StatusBar,
    Animated,
    Easing
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
    LayoutGrid
} from "lucide-react-native";

import { getNotes } from "@/services/isenApi";
import { getId, loadLastUpdateNotes, loadStructureFromCache } from "@/services/storage";
import { Note } from "@/types/note";
import getDonneesAvecNotes from "@/utils/notes";
import UeCard from '../components/ui/notes/UeList';
import configDefault from '../structure_note.json';
import { Colors } from "@/constants/Colors";

export default function NotesScreen() {
    const [notes, setNotes] = useState<Note[]>();
    const [selectedFiliere, setSelectedFiliere] = useState<string | null>(null);
    const [configActuelle, setConfigActuelle] = useState(configDefault);
    const [userId, setUserId] = useState<string | null>("");
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [error, setError] = useState<string | null>(null);
    const [simulatedNotes, setSimulatedNotes] = useState<Record<string, number | null>>({});

    const spinValue = useRef(new Animated.Value(0)).current;

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
                if (finished && !isCancelled) {
                    runAnimation();
                }
            });
        };

        if (!notes && userId !== "") {
            runAnimation();
        }

        return () => {
            isCancelled = true;
            spinValue.stopAnimation();
        };
    }, [notes === undefined, userId]);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    const filieresDisponibles = Object.keys(configActuelle.filieres);

    const updateSimulation = useCallback((id: string, val: number | null) => {
        setSimulatedNotes(prev => ({ ...prev, [id]: val }));
    }, []);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const id = await getId();
                setUserId(id);
            } catch (error) {
                setError("Impossible de récupérer vos identifiants.");
            }
        };
        fetchUser();
    }, []);

    const fetchNote = async () => {
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
            setError(err.message || "Une erreur est survenue lors de la récupération des notes.");
        }
    };

    useEffect(() => {
        fetchNote();
    }, [userId]);

    useEffect(() => {
        const loadConfig = async () => {
            const cachedConfig = await loadStructureFromCache();
            if (cachedConfig) {
                setConfigActuelle(cachedConfig);
            }
        };
        loadConfig();
    }, [lastUpdate]);

    // Écran de sélection de filière
    if (!selectedFiliere) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" />
                <View style={styles.headerSelection}>
                    <Text style={styles.selectionTitle}>Ma Filière</Text>
                    <Text style={styles.selectionSubtitle}>Sélectionnez votre parcours pour voir vos notes</Text>
                </View>
                <FlatList
                    data={filieresDisponibles}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.filiereCard}
                            onPress={() => setSelectedFiliere(item)}
                            activeOpacity={0.7}
                        >
                            <LayoutGrid size={20} color={Colors.primary} />
                            <Text style={styles.filiereText}>{item}</Text>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.selectionList}
                    ListFooterComponent={
                        <TouchableOpacity
                            style={styles.backButtonLarge}
                            onPress={() => router.push("/selection")}
                        >
                            <ChevronLeft size={20} color={Colors.text.secondary} />
                            <Text style={styles.backButtonLargeText}>Retour à l'accueil</Text>
                        </TouchableOpacity>
                    }
                />
            </SafeAreaView>
        );
    }

    // Écran d'erreur
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

                    <TouchableOpacity 
                        style={styles.secondaryButton} 
                        onPress={() => router.push("/")}
                    >
                        <Home size={20} color={Colors.text.primary} />
                        <Text style={styles.secondaryButtonText}>Se reconnecter</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Écran de chargement
    if (!notes && userId !== "") {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerContainer}>
                    <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]}>
                        <Loader2 size={48} color={Colors.primary} />
                    </Animated.View>
                    <Text style={styles.loadingTitle}>Récupération de vos notes...</Text>
                    <Text style={styles.loadingSubtitle}>
                        L'API de l'ISEN prend parfois un peu de temps...
                    </Text>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setSelectedFiliere(null)}
                    >
                        <Text style={styles.cancelButtonText}>Annuler</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const dataFiliere = configActuelle.filieres[selectedFiliere as keyof typeof configActuelle.filieres];
    const resultats = getDonneesAvecNotes(dataFiliere, notes || [], simulatedNotes);
    const donneesAffichables = resultats.structure;
    const stats = resultats.stats;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            {/* Header Moderne */}
            <View style={styles.topHeader}>
                <TouchableOpacity onPress={() => setSelectedFiliere(null)} style={styles.iconBtn}>
                    <ChevronLeft size={24} color={Colors.text.primary} />
                </TouchableOpacity>

                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle} numberOfLines={1}>{selectedFiliere}</Text>
                    <Text style={styles.headerDate}>
                        Mis à jour : {lastUpdate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>

                <TouchableOpacity onPress={() => router.push("/selection")} style={styles.iconBtn}>
                    <Home size={22} color={Colors.text.primary} />
                </TouchableOpacity>
            </View>

            {/* Barre d'info simulation */}
            <View style={styles.infoBar}>
                <Info size={14} color={Colors.primary} />
                <Text style={styles.infoBarText}>Tapez sur une note pour simuler votre moyenne</Text>
            </View>

            {/* Liste Principale */}
            <FlatList
                data={donneesAffichables}
                keyExtractor={(item, index) => item.ue || index.toString()}
                ListHeaderComponent={
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <View style={[styles.statIconContainer, { backgroundColor: Colors.primary + '10' }]}>
                                <TrendingUp size={18} color={Colors.primary} />
                            </View>
                            <Text style={styles.statLabel}>Moyenne</Text>
                            <View style={styles.statValueRow}>
                                <Text style={[
                                    styles.statValue, 
                                    { color: stats.moyenne >= 10 ? Colors.status.success : Colors.status.error }
                                ]}>
                                    {stats.moyenne.toFixed(2)}
                                </Text>
                                <Text style={styles.statMax}>/20</Text>
                            </View>
                        </View>

                        <View style={styles.statCard}>
                            <View style={[styles.statIconContainer, { backgroundColor: Colors.status.success + '10' }]}>
                                <Trophy size={18} color={Colors.status.success} />
                            </View>
                            <Text style={styles.statLabel}>Crédits</Text>
                            <View style={styles.statValueRow}>
                                <Text style={[styles.statValue, { color: Colors.status.info }]}>
                                    {stats.ects}
                                </Text>
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
    container: { 
        flex: 1, 
        backgroundColor: Colors.background 
    },
    listContent: { 
        paddingBottom: 40 
    },
    // Header Moderne
    topHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    iconBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text.primary,
        letterSpacing: -0.5,
    },
    headerDate: {
        fontSize: 10,
        color: Colors.text.tertiary,
        marginTop: 2,
    },
    // Info Bar
    infoBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primaryLight,
        paddingVertical: 8,
        gap: 8,
    },
    infoBarText: {
        fontSize: 11,
        color: Colors.primary,
        fontWeight: '600',
    },
    // Stats
    statsRow: { 
        flexDirection: 'row', 
        gap: 12, 
        padding: 16 
    },
    statCard: { 
        flex: 1, 
        backgroundColor: Colors.surface, 
        padding: 16, 
        borderRadius: 20, 
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    statIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    statLabel: { 
        fontSize: 11, 
        color: Colors.text.secondary, 
        fontWeight: '700', 
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statValueRow: { 
        flexDirection: 'row', 
        alignItems: 'baseline',
        marginTop: 4,
    },
    statValue: { 
        fontSize: 24, 
        fontWeight: '800',
        letterSpacing: -1,
    },
    statMax: { 
        fontSize: 12, 
        color: Colors.text.tertiary, 
        fontWeight: '600',
        marginLeft: 2,
    },
    // Sélection Filière
    headerSelection: {
        padding: 24,
        paddingTop: 40,
    },
    selectionTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: Colors.text.primary,
        letterSpacing: -1,
    },
    selectionSubtitle: {
        fontSize: 15,
        color: Colors.text.secondary,
        marginTop: 8,
    },
    selectionList: {
        paddingHorizontal: 16,
    },
    filiereCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: 20,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: 16,
    },
    filiereText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    backButtonLarge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        gap: 8,
    },
    backButtonLargeText: {
        color: Colors.text.secondary,
        fontWeight: '600',
    },
    // États
    centerContainer: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: 32,
    },
    spinner: {
        marginBottom: 24,
    },
    loadingTitle: { 
        fontSize: 20, 
        fontWeight: '700', 
        color: Colors.text.primary,
        textAlign: 'center',
    },
    loadingSubtitle: { 
        fontSize: 14,
        color: Colors.text.secondary, 
        textAlign: 'center', 
        marginTop: 8,
    },
    cancelButton: {
        marginTop: 32,
        padding: 12,
    },
    cancelButtonText: {
        color: Colors.text.tertiary,
        fontWeight: '600',
    },
    errorIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.status.error + '10',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    errorTitle: { 
        fontSize: 20, 
        fontWeight: '700', 
        color: Colors.text.primary,
        textAlign: 'center',
    },
    errorMessage: { 
        fontSize: 14,
        color: Colors.text.secondary, 
        textAlign: 'center', 
        marginTop: 12,
        marginBottom: 32,
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 14,
        gap: 10,
        width: '100%',
        justifyContent: 'center',
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: 10,
        width: '100%',
        justifyContent: 'center',
        marginTop: 12,
    },
    secondaryButtonText: {
        color: Colors.text.primary,
        fontSize: 16,
        fontWeight: '700',
    }
});