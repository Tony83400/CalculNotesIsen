import { getNotes } from "@/constants/api/route";
import { useEffect, useState } from "react";
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
    const [moyenne,setMoyenne] = useState(0);
    const [nbEctsTot,setNbectsTot] = useState(0); 
    const fetchNote = async () => {
        try {
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
    const getDonneesAvecNotes = (): UeData[] => {
    const structureCopie: UeData[] = JSON.parse(JSON.stringify(dataFiliere));

    let ectsValides = 0; // ECTS réellement gagnés (sur 30)
    let totalPointsSemestre = 0; // Pour calculer la vraie moyenne générale
    let totalEctsSemestre = 0;   // Diviseur pour la moyenne générale

    structureCopie.forEach((ue) => {
        let sommePointsUE = 0;
        let totalCoeffUE = 0;
        
        // Drapeaux pour la validation
        let ueEstComplete = true; // Toutes les notes sont là ?
        let pasDeNoteEliminatoire = true; // Aucune matière <= 6 ?

        ue.matieres.forEach((matiere) => {
            let sommePointsMat = 0;
            let totalCoeffMat = 0;

            matiere.evaluations.forEach((evaluation) => {
                const noteTrouvee = notes?.find(n => n.code === evaluation.code);

                if (noteTrouvee) {
                    evaluation.noteReelle = noteTrouvee.note;
                    sommePointsMat += noteTrouvee.note * evaluation.coeff;
                    totalCoeffMat += evaluation.coeff;
                } else {
                    evaluation.noteReelle = null;
                    ueEstComplete = false; // Il manque une note !
                }
            });

            // --- CALCUL MOYENNE MATIÈRE ---
            if (totalCoeffMat > 0) {
                matiere.moyenne = sommePointsMat / totalCoeffMat;
                
                // Vérification note éliminatoire (Strictement supérieur à 6)
                if (matiere.moyenne <= 6) {
                    pasDeNoteEliminatoire = false;
                }

                sommePointsUE += matiere.moyenne * matiere.coeff_matiere;
                totalCoeffUE += matiere.coeff_matiere;
            } else {
                matiere.moyenne = null;
                ueEstComplete = false; // Pas de moyenne = incomplet
            }
        });

        // --- CALCUL MOYENNE UE & VALIDATION ---
        if (totalCoeffUE > 0) {
            ue.moyenne = sommePointsUE / totalCoeffUE;

            // RÈGLES DE VALIDATION ECTS :
            // 1. UE Complète (pas de note manquante)
            // 2. Moyenne UE >= 10
            // 3. Pas de matière <= 6
            const estValide = ueEstComplete && ue.moyenne >= 10 && pasDeNoteEliminatoire;
            
            ue.isValidated = estValide; // On stocke l'info pour l'affichage

            if (estValide) {
                ectsValides += ue.ects;
            }

            // Pour la Moyenne Générale (on compte tout, même les échecs)
            totalPointsSemestre += ue.moyenne * ue.ects;
            totalEctsSemestre += ue.ects;

        } else {
            ue.moyenne = null;
            ue.isValidated = false;
        }
    });

    // Mise à jour des états
    setNbectsTot(ectsValides); // Affiche seulement ceux validés (ex: 12/30)
    
    // Moyenne générale du semestre
    if (totalEctsSemestre > 0) {
        setMoyenne(totalPointsSemestre / totalEctsSemestre);
    } else {
        setMoyenne(0);
    }

    return structureCopie;
};
    const donneesAffichables = notes ? getDonneesAvecNotes() : [];
    return (
        <SafeAreaView style={styles.container}>
            {/* Petit bouton retour en haut */}
            <TouchableOpacity onPress={() => setSelectedFiliere(null)} style={styles.backButton}>
                <Text style={styles.backText}>← Changer de filière</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Promo {selectedFiliere}</Text>

            <FlatList
                data={donneesAffichables}
                keyExtractor={(item, index) => item.ue || index.toString()}
                renderItem={({ item }) => (
                    <UeCard ueData={item} />
                )}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
            {/* --- BLOC STATISTIQUES (En haut de page) --- */}
<View style={styles.statsContainer}>
    
    {/* Carte MOYENNE */}
    <View style={styles.statCard}>
        <Text style={styles.statLabel}>Moyenne Générale</Text>
        <View style={styles.valueContainer}>
            <Text style={[
                styles.statValue, 
                { color: moyenne >= 10 ? '#4CAF50' : '#F44336' } // Vert ou Rouge
            ]}>
                {moyenne.toFixed(2)}
            </Text>
            <Text style={styles.statSuffix}>/20</Text>
        </View>
    </View>

    {/* Carte ECTS */}
    <View style={styles.statCard}>
        <Text style={styles.statLabel}>Crédits ECTS</Text>
        <View style={styles.valueContainer}>
            <Text style={[styles.statValue, { color: '#2196F3' }]}> {/* Bleu */}
                {nbEctsTot}
            </Text>
            <Text style={styles.statSuffix}> /30</Text>
        </View>
    </View>

</View>
        </SafeAreaView>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
        paddingTop: 10,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 20,
        textAlign: 'center',
    },
    // Styles pour les gros boutons de choix
    buttonChoice: {
        backgroundColor: '#2196F3', // Bleu
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 10,
        marginBottom: 15,
        width: 200, // Largeur fixe pour être joli
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    // Style bouton retour
    backButton: {
        padding: 10,
        marginLeft: 10,
    },
    backText: {
        color: '#2196F3',
        fontWeight: '600',
    },
    // --- STYLE DASHBOARD STATS ---
    statsContainer: {
        flexDirection: 'row',       // Met les cartes côte à côte
        justifyContent: 'space-between', // Espace égal entre les deux
        paddingHorizontal: 20,      // Marge sur les côtés de l'écran
        marginBottom: 20,           // Espace avant la liste des cours
        marginTop: 10,
    },
    statCard: {
        backgroundColor: 'white',
        width: '48%',               // Chaque carte prend un peu moins de la moitié
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderRadius: 16,
        alignItems: 'center',       // Centre le texte
        // Ombre douce pour l'effet "carte flottante"
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
    },
    statLabel: {
        fontSize: 12,
        color: '#888',
        fontWeight: '600',
        textTransform: 'uppercase', // MAJUSCULES élégantes
        marginBottom: 5,
        letterSpacing: 0.5,
    },
    valueContainer: {
        flexDirection: 'row',       // Pour aligner la note et le "/20"
        alignItems: 'baseline',     // Aligne le bas des textes
    },
    statValue: {
        fontSize: 28,               // Gros chiffre
        fontWeight: 'bold',
    },
    statSuffix: {
        fontSize: 14,
        color: '#BBB',
        fontWeight: '600',
        marginLeft: 2,
    },
});