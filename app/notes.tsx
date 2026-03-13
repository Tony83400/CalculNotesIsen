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
import UeCard from '../components/ui/notes/UeList';
import configDefault from '../structure_note.json';
import RefreshButton from "@/components/ui/notes/RefreshButton";
import { Colors } from "@/constants/Colors";

export default function Main() {


    const [notes, setNotes] = useState<Note[]>();
    const [selectedFiliere, setSelectedFiliere] = useState<string | null>(null);
    const [configActuelle, setConfigActuelle] = useState(configDefault);
    const [userId, setUserId] = useState<string | null>("");
    const filieresDisponibles = Object.keys(configActuelle.filieres);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [error, setError] = useState<string | null>(null);


    // State pour les simulations. Clé = uniqueId, Valeur = note
    const [simulatedNotes, setSimulatedNotes] = useState<Record<string, number | null>>({});

    // Mise à jour d'une simulation
    const updateSimulation = useCallback((id: string, val: number | null) => {
        setSimulatedNotes(prev => ({
            ...prev,
            [id]: val
        }));
    }, []);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const id = await getId();
                setUserId(id);
            } catch (error) {
                console.error("Erreur Id:", error);
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
                if (date != new Date(0)) {
                    setLastUpdate(date);
                }
            }
        } catch (err: any) {
            console.error("Erreur notes:", err);
            setError(err.message || "Une erreur est survenue lors de la récupération des notes.");
        }
    };

    useEffect(() => {
        fetchNote();
    }, [userId]);
    useEffect(() => {
        const loadConfig = async () => {
            // On essaie de récupérer la config sauvegardée dans le téléphone
            const cachedConfig = await loadStructureFromCache();
            if (cachedConfig) {
                setConfigActuelle(cachedConfig);
            }
        };
        loadConfig();
    }, [lastUpdate]);


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
                        style={styles.buttonChoice}
                        onPress={() => router.push("/selection")}
                    >
                        <Text style={styles.buttonText}>← Retour</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={[styles.center, { padding: 30 }]}>
                    <Text style={{ fontSize: 40, marginBottom: 20 }}>⚠️</Text>
                    <Text style={[styles.title, { fontSize: 20 }]}>Oups ! Une erreur est survenue</Text>
                    <Text style={{ color: Colors.text.secondary, textAlign: 'center', marginBottom: 30 }}>
                        {error}
                    </Text>

                    <TouchableOpacity
                        style={[styles.buttonChoice, { backgroundColor: Colors.primary }]}
                        onPress={fetchNote}
                    >
                        <Text style={styles.buttonText}>Réessayer</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.buttonChoice, { backgroundColor: '#F3F4F6', marginTop: 10 }]}
                        onPress={() => router.push("/")}
                    >
                        <Text style={[styles.buttonText, { color: '#374151' }]}>Se reconnecter</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={{ marginTop: 20 }}
                        onPress={() => setSelectedFiliere(null)}
                    >
                        <Text style={{ color: Colors.primary, fontWeight: '600' }}>Changer de filière</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (!notes && userId != "") {
        return (
            <SafeAreaView style={styles.container}>
                <View style={[styles.center, { padding: 20 }]}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={[styles.title, { marginTop: 20, fontSize: 18 }]}>
                        Récupération de vos notes...
                    </Text>
                    <Text style={{ color: Colors.text.secondary, textAlign: 'center', marginBottom: 30 }}>
                        L'api de l'isen est lente c'est pas de ma faute.
                    </Text>
                    
                    <TouchableOpacity
                        style={styles.buttonChoice}
                        onPress={() => setSelectedFiliere(null)}
                    >
                        <Text style={styles.buttonText}>← Annuler</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const dataFiliere = configActuelle.filieres[selectedFiliere as keyof typeof configActuelle.filieres];
    let resultats;
    if (notes) {
        resultats = getDonneesAvecNotes(dataFiliere, notes, simulatedNotes);
    }
    else {
        resultats = getDonneesAvecNotes(dataFiliere, [], simulatedNotes);
    }

    const donneesAffichables = resultats.structure;
    const stats = resultats.stats;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
                {/* Zone Gauche : Bouton Retour */}
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => setSelectedFiliere(null)} style={styles.backButton}>
                        <Text style={styles.backText}>← Retour</Text>
                    </TouchableOpacity>
                </View>

                {/* Zone Centre : Titre */}
                <View style={styles.headerCenter}>
                    <Text style={styles.topTitle} numberOfLines={1}>
                        {selectedFiliere}
                    </Text>
                    <Text style={styles.headerSubtitle}>
                        Dernière mise à jour: {lastUpdate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <Text style={styles.discreetHintHeader}>
                        💡 Cliquer sur une note pour la modifier
                    </Text>
                    {/* <RefreshButton/> */}
                </View>
                {/* Zone Droite : Bouton Déconnexion */}
                <View style={styles.headerRight}>
                    <TouchableOpacity onPress={() => router.push("/selection")} style={styles.backButton}>
                        <Text style={styles.backText}>Accueil ⌂</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Moyenne Générale</Text>
                    <View style={styles.valueContainer}>
                        <Text style={[styles.statValue, { color: stats.moyenne >= 10 ? '#4CAF50' : '#F44336' }]}>
                            {stats.moyenne.toFixed(2)}
                        </Text>
                        <Text style={styles.statSuffix}>/20</Text>
                    </View>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Crédits ECTS</Text>
                    <View style={styles.valueContainer}>
                        <Text style={[styles.statValue, { color: '#2196F3' }]}>{stats.ects}</Text>
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
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
        // Ajout important pour éviter que le header ne soit sous la barre de statut (batterie/heure)
        paddingTop: 50, // Ajustez selon si vous utilisez SafeAreaView ou non
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderColor: '#E5E7EB'
    },

    // 1. Zone Gauche : Prend 20% de place, aligné à gauche
    headerLeft: {
        flex: 1,
        alignItems: 'flex-start',
    },

    // 2. Zone Centre : Prend 60% de place, parfaitement centré
    headerCenter: {
        flex: 3,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // 3. Zone Droite : Prend 20% de place, aligné à droite
    headerRight: {
        flex: 1,
        alignItems: 'flex-end',
    },
headerSubtitle: {
        fontSize: 11,
        color: '#6B7280',
        marginTop: 2,
   },
    topTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },

    backButton: {
        padding: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 8
    },

    backText: {
        color: '#374151',
        fontWeight: '600',
        fontSize: 12
    },
    container: { flex: 1, backgroundColor: '#F2F5F8' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    buttonChoice: { backgroundColor: '#2563EB', padding: 16, borderRadius: 12, marginBottom: 12, width: 240, alignItems: 'center' },
    buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },


    statsContainer: { flexDirection: 'row', gap: 12, padding: 16 },
    statCard: { flex: 1, backgroundColor: 'white', padding: 16, borderRadius: 16, alignItems: 'center', elevation: 2 },
    statLabel: { fontSize: 11, color: '#6B7280', fontWeight: 'bold', textTransform: 'uppercase' },
    valueContainer: { flexDirection: 'row', alignItems: 'baseline' },
    statValue: { fontSize: 26, fontWeight: '800' },
    statSuffix: { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },
    discreetHintHeader: {
        fontSize: 10,
        color: '#9CA3AF',
        fontStyle: 'italic',
        marginTop: 2,
    },
});


