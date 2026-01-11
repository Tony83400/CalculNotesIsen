import { getNotes } from "@/constants/api/route";
import { useEffect, useState, useCallback } from "react";
import { Note, UeData } from "@/constants/data";
import {
    Text,
    View,
    StyleSheet,
    FlatList,
    SafeAreaView,
    TouchableOpacity
} from "react-native";
import configActuelle from '../structure_note.json';
import UeCard from '../components/afficheUe'
import getDonneesAvecNotes from "@/constants/notes";
import { getId } from "@/constants/token";
import { router } from "expo-router";

export default function Main() {
    const [notes, setNotes] = useState<Note[]>();
    const [selectedFiliere, setSelectedFiliere] = useState<string | null>(null);
    const filieresDisponibles = Object.keys(configActuelle.filieres);
    
    // State pour les simulations. Clé = uniqueId, Valeur = note
    const [simulatedNotes, setSimulatedNotes] = useState<Record<string, number | null>>({});

    // Mise à jour d'une simulation
    const updateSimulation = useCallback((id: string, val: number | null) => {
        setSimulatedNotes(prev => ({
            ...prev,
            [id]: val
        }));
    }, []);

    const fetchNote = async () => {
        try {
            console.log("Recuperation des notes ...");
            const rep = await getNotes();
            const formattedNotes: Note[] = rep.map((elt: any) => ({
                code: elt.code,
                name: elt.name,
                note: Number(elt.note),
                date: elt.date
            }));
            setNotes(formattedNotes);
        } catch (error) {
            console.error("Erreur dans le composant :", error);
        }
    };
    if (getId() != "") {
          useEffect(() => {
        fetchNote();
    }, []);
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
                                style={styles.buttonChoice}
                                onPress={() => router.push("/")}
                            >
                                <Text style={styles.buttonText}>← Retour à l'accueil</Text>
                            </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (!notes && getId() != "") {
        return (
            <View style={styles.center}>
                <Text>Chargement...</Text>
            </View>
        )
    }

    const dataFiliere = configActuelle.filieres[selectedFiliere as keyof typeof configActuelle.filieres];
    let resultats;
    if (notes){
    resultats = getDonneesAvecNotes(dataFiliere, notes,simulatedNotes);
    }
    else{
             resultats = getDonneesAvecNotes(dataFiliere, [],simulatedNotes);
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
    </View>

    {/* Zone Droite : Bouton Déconnexion */}
    <View style={styles.headerRight}>
        <TouchableOpacity onPress={() => router.push("/")} style={styles.backButton}>
            {/* J'ai raccourci le texte pour que ça rentre, sinon utilisez une icône */}
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
                        ueData={item} 
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
});


