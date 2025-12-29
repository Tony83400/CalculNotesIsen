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

    useEffect(() => {
        fetchNote();
    }, []);

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
                </View>
            </SafeAreaView>
        );
    }

    if (!notes) {
        return (
            <View style={styles.center}>
                <Text>Chargement...</Text>
            </View>
        )
    }

    const dataFiliere = configActuelle.filieres[selectedFiliere as keyof typeof configActuelle.filieres];

    const getDonneesAvecNotes = () => {
        const structureCopie: UeData[] = JSON.parse(JSON.stringify(dataFiliere));

        let ectsValides = 0;
        let totalPointsSemestre = 0;
        let totalEctsSemestre = 0;

        structureCopie.forEach((ue) => {
            let sommePointsUE = 0;
            let totalCoeffUE = 0;
            let ueEstComplete = true;
            let pasDeNoteEliminatoire = true;

            ue.matieres.forEach((matiere) => {
                let sommePointsMat = 0;
                let totalCoeffMat = 0;

                matiere.evaluations.forEach((evaluation, indexEval) => {
                    // 1. Génération d'un ID UNIQUE pour éviter le bug des sliders liés
                    // Si pas de code, on combine nom_matiere + nom_eval + index
                    const uniqueId = evaluation.code && evaluation.code.length > 0 
                        ? evaluation.code 
                        : `${matiere.name}_${evaluation.name}_${indexEval}`;
                    
                    evaluation.uniqueId = uniqueId;

                    // 2. Recherche note API
                    const noteFromApi = notes.find(n => n.code === evaluation.code);
                    
                    // 3. Gestion Priorité : Simulation > API > Rien
                    const simu = simulatedNotes[uniqueId];
                    
                    let finalNote: number | null = null;
                    let isFromApi = false;

                    // Si une simulation existe, elle gagne
                    if (simu !== undefined && simu !== null) {
                        finalNote = simu;
                    } 
                    // Sinon, si on a une note API
                    else if (noteFromApi) {
                        finalNote = noteFromApi.note;
                        isFromApi = true;
                    }

                    // On stocke les infos pour l'affichage
                    evaluation.noteReelle = finalNote;
                    evaluation.hasApiNote = isFromApi; // <-- Pour cacher le slider

                    // Calculs
                    if (finalNote !== null) {
                        sommePointsMat += finalNote * evaluation.coeff;
                        totalCoeffMat += evaluation.coeff;
                    } else {
                        ueEstComplete = false;
                    }
                });

                if (totalCoeffMat > 0) {
                    matiere.moyenne = sommePointsMat / totalCoeffMat;
                    if (matiere.moyenne < 6) pasDeNoteEliminatoire = false;
                    sommePointsUE += matiere.moyenne * matiere.coeff_matiere;
                    totalCoeffUE += matiere.coeff_matiere;
                } else {
                    matiere.moyenne = null;
                    ueEstComplete = false;
                }
            });

            if (totalCoeffUE > 0) {
                ue.moyenne = sommePointsUE / totalCoeffUE;
                const estValide = ueEstComplete && ue.moyenne >= 10 && pasDeNoteEliminatoire;
                ue.isValidated = estValide;

                if (estValide) ectsValides += ue.ects;

                totalPointsSemestre += ue.moyenne * ue.ects;
                totalEctsSemestre += ue.ects;
            } else {
                ue.moyenne = null;
                ue.isValidated = false;
            }
        });

        const moyGen = totalEctsSemestre > 0 ? totalPointsSemestre / totalEctsSemestre : 0;

        return {
            structure: structureCopie,
            stats: { ects: ectsValides, moyenne: moyGen }
        };
    };

    const resultats = getDonneesAvecNotes();
    const donneesAffichables = resultats.structure;
    const stats = resultats.stats;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => setSelectedFiliere(null)} style={styles.backButton}>
                    <Text style={styles.backText}>← Retour</Text>
                </TouchableOpacity>
                <Text style={styles.topTitle}>{selectedFiliere}</Text>
                <View style={{width: 60}} /> 
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
    container: { flex: 1, backgroundColor: '#F2F5F8' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#E5E7EB' },
    topTitle: { fontSize: 18, fontWeight: 'bold' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    buttonChoice: { backgroundColor: '#2563EB', padding: 16, borderRadius: 12, marginBottom: 12, width: 240, alignItems: 'center' },
    buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    backButton: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 8 },
    backText: { color: '#374151', fontWeight: '600' },
    statsContainer: { flexDirection: 'row', gap: 12, padding: 16 },
    statCard: { flex: 1, backgroundColor: 'white', padding: 16, borderRadius: 16, alignItems: 'center', elevation: 2 },
    statLabel: { fontSize: 11, color: '#6B7280', fontWeight: 'bold', textTransform: 'uppercase' },
    valueContainer: { flexDirection: 'row', alignItems: 'baseline' },
    statValue: { fontSize: 26, fontWeight: '800' },
    statSuffix: { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },
});