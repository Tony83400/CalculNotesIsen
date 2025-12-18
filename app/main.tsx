import { getNotes } from "@/constants/api/route";
import { useEffect, useState } from "react";
import { Note } from "@/constants/data";
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
    const getDonneesAvecNotes = () => {
       
        const structureCopie = JSON.parse(JSON.stringify(dataFiliere));

        structureCopie.forEach((ue: { matieres: any[]; }) => {
            ue.matieres.forEach((matiere: { evaluations: any[]; }) => {
                matiere.evaluations.forEach((evaluation: { code: string; noteReelle: number | null; }) => {

                    const noteTrouvee = notes.find(n => n.code === evaluation.code);

                    if (noteTrouvee) {
                        evaluation.noteReelle = noteTrouvee.note;
                    } else {
                        evaluation.noteReelle = null;
                    }

                });
            });
        });

        return structureCopie;
    };
    const donneesAffichables = notes ? getDonneesAvecNotes() : [];
    console.log(donneesAffichables)
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
    }
});