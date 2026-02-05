import NotesHeader from "@/components/ui/notes/NotesHeader";
import UeCard from "@/components/ui/notes/UeList";
import { Colors } from "@/constants/Colors";
import { getNotes } from "@/services/isenApi";
import { getId, loadLastUpdateNotes, loadStructureFromCache } from "@/services/storage";
import { Note } from "@/types/note";
import getDonneesAvecNotes from "@/utils/notes";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
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
                <View style={styles.selectionContainer}>
                    <Text style={styles.title}>Sélection de la Filière</Text>
                    <Text style={styles.subtitle}>Choisissez la filière pour laquelle vous souhaitez consulter les notes.</Text>
                    <FlatList
                        data={filieresDisponibles}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.buttonChoice}
                                onPress={() => setSelectedFiliere(item)}
                            >
                                <Text style={styles.buttonText}>{item}</Text>
                                <Ionicons name="chevron-forward" size={20} color={Colors.primary} />
                            </TouchableOpacity>
                        )}
                        contentContainerStyle={styles.listContent}
                    />
                    <TouchableOpacity
                        style={styles.buttonBack}
                        onPress={() => router.push("/selection")}
                    >
                        <Ionicons name="arrow-back" size={16} color={Colors.text.secondary} />
                        <Text style={styles.buttonBackText}>Retour à l'accueil</Text>
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
    selectionContainer: {
        flex: 1,
        padding: 20,
        paddingTop: 50,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
        color: Colors.text.primary,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.text.secondary,
        marginBottom: 32,
    },
    listContent: {
        paddingBottom: 20,
    },
    buttonChoice: {
        backgroundColor: Colors.surface,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 4,
    },
    buttonText: {
        color: Colors.text.primary,
        fontSize: 16,
        fontWeight: '600',
    },
    buttonBack: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    buttonBackText: {
        color: Colors.text.secondary,
        fontSize: 14,
        fontWeight: '600',
    },

    // Stats
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    statCard: {
        flex: 1,
        backgroundColor: Colors.surface,
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    statLabel: {
        fontSize: 10,
        color: Colors.text.secondary,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    valueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    statValue: {
        fontSize: 22,
        fontWeight: '800',
    },
    statSuffix: {
        fontSize: 12,
        color: Colors.text.tertiary,
        fontWeight: '600',
        marginLeft: 2,
    },
    gradeBadge: {
        flexDirection: 'row',
        alignItems: 'baseline',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 16,
    },
});

