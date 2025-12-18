import { getNotes } from "@/constants/api/route";
import { useEffect, useState } from "react";
import { Note } from "@/constants/data";
import {
    Text,
    View,
    StyleSheet, // 1. On garde StyleSheet pour organiser proprement
    FlatList
} from "react-native";

export default function Main() {
    const [notes, setNotes] = useState<Note[]>();

    const fetchNote = async () => {
        console.log("Lancement du fetch...");
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

    if (!notes) {
        return (
            <View style={styles.center}>
                <Text>Chargement...</Text>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Mes Notes</Text>
            
            <FlatList
                data={notes}
                keyExtractor={(item, index) => item.code || index.toString()}
                renderItem={({ item }) => (
                    // Chaque item est une "boite" grise simple
                    <View style={styles.item}>
                        {/* Ligne du haut : Nom + Note */}
                        <View style={styles.row}>
                            <Text style={styles.name}>{item.name}</Text>
                            <Text style={styles.note}>{item.note}/20</Text>
                        </View>
                        
                        {/* Ligne du bas : Code + Date */}
                        <View style={styles.row}>
                            <Text style={styles.details}>{item.code}</Text>
                            <Text style={styles.details}>{item.date}</Text>
                        </View>
                    </View>
                )}
            />
        </View>
    )
}

// --- LE STYLE SIMPLE ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,         // Marge autour de l'écran
        backgroundColor: '#fff',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,    // Espace sous le titre
    },
    item: {
        backgroundColor: '#f0f0f0', // Fond gris clair
        padding: 15,                // Espace à l'intérieur de la boite
        borderRadius: 8,            // Coins un peu arrondis
        marginBottom: 10,           // Espace entre les boites
    },
    row: {
        flexDirection: 'row',       // Met les textes sur la même ligne
        justifyContent: 'space-between', // Ecarte les textes (gauche / droite)
        marginBottom: 5,
    },
    name: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    note: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    details: {
        color: '#666', // Gris foncé pour les infos secondaires
        fontSize: 12,
    }
});