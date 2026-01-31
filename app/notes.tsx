import NotesHeader from "@/components/ui/notes/NotesHeader";
import UeCard from "@/components/ui/notes/UeList";
import { Colors } from "@/constants/Colors";
import { getNotes } from "@/services/isenApi";
import { getId, loadLastUpdateNotes, loadStructureFromCache } from "@/services/storage";
import { Note } from "@/types/note";
import getDonneesAvecNotes from "@/utils/notes";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator
} from "react-native";
import configDefault from '../structure_note.json';

export default function Main() {
    const [notes, setNotes] = useState<Note[]>();
    const [selectedFiliere, setSelectedFiliere] = useState<string | null>(null);
    const [configActuelle, setConfigActuelle] = useState(configDefault);
    const [userId, setUserId] = useState<string | null>("");
    const filieresDisponibles = Object.keys(configActuelle.filieres);
    const [lastUpdate, setLastUpdate] = useState(new Date(0));
    const [isLoading, setIsLoading] = useState(true);

    const [simulatedNotes, setSimulatedNotes] = useState<Record<string, number | null>>({});

    const updateSimulation = useCallback((id: string, val: number | null) => {
        setSimulatedNotes(prev => ({ ...prev, [id]: val }));
    }, []);

    useEffect(() => {
        const bootstrap = async () => {
            setIsLoading(true);
            try {
                const id = await getId();
                setUserId(id);

                if (id) {
                    const cachedConfig = await loadStructureFromCache();
                    if (cachedConfig) {
                        setConfigActuelle(cachedConfig);
                    }

                    const rep = await getNotes();
                    if (rep) {
                        setNotes(rep);
                    }
                    
                    const date = await loadLastUpdateNotes();
                    if (date) {
                        setLastUpdate(date);
                    }
                }
            } catch (error) {
                console.error("Erreur au démarrage:", error);
            } finally {
                setIsLoading(false);
            }
        };

        bootstrap();
    }, []);

    if (isLoading && !notes) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Chargement des notes...</Text>
            </View>
        );
    }

    if (!selectedFiliere) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <Text style={styles.title}>Choisissez votre filière</Text>
                    <FlatList
                        data={filieresDisponibles}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.buttonChoice}
                                onPress={() => setSelectedFiliere(item)}
                            >
                                <Text style={styles.buttonText}>{item}</Text>
                            </TouchableOpacity>
                        )}
                        contentContainerStyle={{ padding: 20 }}
                    />
                    <TouchableOpacity
                        style={[styles.buttonChoice, styles.buttonBack]}
                        onPress={() => router.push("/selection")}
                    >
                        <Text style={[styles.buttonText, styles.buttonBackText]}>← Retour</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const dataFiliere = configActuelle.filieres[selectedFiliere as keyof typeof configActuelle.filieres];
    const { structure: donneesAffichables, stats } = getDonneesAvecNotes(dataFiliere, notes || [], simulatedNotes);

    const isGradeGood = stats.moyenne >= 10;

    return (
        <SafeAreaView style={styles.container}>
            <NotesHeader
                filiere={selectedFiliere}
                lastUpdate={lastUpdate}
                onBack={() => setSelectedFiliere(null)}
                onHome={() => router.push("/")}
            />

            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Moyenne Générale</Text>
                    <View style={[
                        styles.gradeBadge,
                        { backgroundColor: isGradeGood ? Colors.status.successLight : Colors.status.errorLight }
                    ]}>
                        <Text style={[
                            styles.statValue,
                            { color: isGradeGood ? Colors.status.success : Colors.status.error }
                        ]}>
                            {stats.moyenne.toFixed(2)}
                        </Text>
                        <Text style={[
                            styles.statSuffix,
                            { color: isGradeGood ? Colors.status.success : Colors.status.error }
                        ]}>/20</Text>
                    </View>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Crédits ECTS</Text>
                    <View style={styles.valueContainer}>
                        <Text style={[styles.statValue, { color: Colors.primary }]}>{stats.ects}</Text>
                        <Text style={styles.statSuffix}> /30</Text>
                    </View>
                </View>
            </View>

            <FlatList
                data={donneesAffichables}
                keyExtractor={(item, index) => item.ue || index.toString()}
                renderItem={({ item }) => (
                    <UeCard
                        Ue={item}
                        simulatedNotes={simulatedNotes}
                        updateSimulation={updateSimulation}
                    />
                )}
                contentContainerStyle={{ paddingBottom: 40 }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: Colors.text.secondary,
    },

    // Filiere Selection
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 24,
        textAlign: 'center',
        color: Colors.text.primary,
    },
    buttonChoice: {
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        marginBottom: 12,
        width: 280,
        alignItems: 'center',
    },
    buttonText: {
        color: Colors.text.inverse,
        fontSize: 16,
        fontWeight: 'bold',
    },
    buttonBack: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    buttonBackText: {
        color: Colors.text.primary,
    },

    // Stats
    statsContainer: {
        flexDirection: 'row',
        gap: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: Colors.surface,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        // iOS Shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 10,
        elevation: 5,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.text.secondary,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    valueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    statValue: {
        fontSize: 28,
        fontWeight: '800',
    },
    statSuffix: {
        fontSize: 14,
        color: Colors.text.tertiary,
        fontWeight: '600',
        marginLeft: 2,
    },
    // New Grade Badge Style
    gradeBadge: {
        flexDirection: 'row',
        alignItems: 'baseline',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20, // Pill shape
    },
});
