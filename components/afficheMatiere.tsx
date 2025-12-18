import { Evaluations } from "@/constants/data";
import {
    Text,
    View,
    StyleSheet,
    FlatList
} from "react-native";

export default function MatiereCard({ evaluationData }: { evaluationData: Evaluations[] }) {

    // Petite fonction pour gérer la couleur de la note
    const getNoteColor = (note: number | undefined | null) => {
        if (note === undefined || note === null) return "#BDBDBD"; // Gris si pas de note
        if (note >= 10) return "#4CAF50"; // Vert
        if (note >= 8) return "#FF9800";  // Orange
        return "#F44336";                 // Rouge
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={evaluationData}
                keyExtractor={(item, index) => item.code || index.toString()}
                renderItem={({ item }) => {
                    const hasNote = item.noteReelle !== undefined && item.noteReelle !== null;

                    return (
                        <View style={styles.row}>
                            {/* Partie GAUCHE : Nom + Code */}
                            <View style={styles.leftInfo}>
                                <Text style={styles.name}>{item.name}</Text>
                                {item.code ? <Text style={styles.code}>{item.code}</Text> : null}
                            </View>

                            {/* Partie DROITE : Note + Coeff */}
                            <View style={styles.rightInfo}>
                                {/* Affichage de la Note */}
                                <Text style={[styles.noteText, { color: getNoteColor(item.noteReelle) }]}>
                                    {hasNote ? item.noteReelle : "--"}
                                    <Text style={styles.surVingt}>/20</Text>
                                </Text>
                                
                                {/* Affichage du Coeff */}
                                <Text style={styles.coeff}>Coeff. {item.coeff}</Text>
                            </View>
                        </View>
                    );
                }}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginTop: 5,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE', // Séparateur discret entre les évals
    },
    leftInfo: {
        flex: 1, // Prend la place disponible à gauche
        flexDirection: 'column',
        paddingRight: 10,
    },
    name: {
        fontSize: 14,
        color: '#444',
        fontWeight: '500',
    },
    code: {
        fontSize: 11,
        color: '#999',
        marginTop: 2,
    },
    rightInfo: {
        alignItems: 'flex-end', // Aligne tout à droite
        minWidth: 60,
    },
    noteText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    surVingt: {
        fontSize: 10,
        color: '#999',
        fontWeight: 'normal',
    },
    coeff: {
        fontSize: 11,
        color: '#888',
        marginTop: 2,
    }
});