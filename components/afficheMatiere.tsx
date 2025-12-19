import { Evaluations } from "@/constants/data";
import { Text, View, StyleSheet } from "react-native";

export default function MatiereCard({ evaluationData }: { evaluationData: Evaluations[] }) {

    // Gestion des couleurs pour les notes
    const getNoteColor = (note: number | undefined | null) => {
        if (note === undefined || note === null) return "#BDBDBD"; // Gris
        if (note >= 10) return "#4CAF50"; // Vert
        if (note >= 8) return "#FF9800";  // Orange
        return "#F44336";                 // Rouge
    };

    return (
        <View style={styles.container}>
            {evaluationData.map((item, index) => {
                const hasNote = item.noteReelle !== undefined && item.noteReelle !== null;
                // On affiche une ligne de séparation sauf pour le dernier élément
                const isLast = index === evaluationData.length - 1;

                return (
                    <View 
                        key={item.code || index} 
                        style={[styles.row, !isLast && styles.separator]}
                    >
                        {/* GAUCHE : Nom et Code */}
                        <View style={styles.leftInfo}>
                            <Text style={styles.name}>{item.name}</Text>
                            {item.code ? <Text style={styles.code}>{item.code}</Text> : null}
                        </View>

                        {/* DROITE : Note et Coeff */}
                        <View style={styles.rightInfo}>
                            <View style={styles.noteContainer}>
                                <Text style={[styles.noteValue, { color: getNoteColor(item.noteReelle) }]}>
                                    {hasNote ? item.noteReelle : "--"}
                                </Text>
                                <Text style={styles.noteTotal}>/20</Text>
                            </View>
                            <Text style={styles.coeff}>x{item.coeff}</Text>
                        </View>
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#F8F9FA', // Gris très léger
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    separator: {
        borderBottomWidth: 1,
        borderBottomColor: '#EAEAEA', // Trait de séparation très fin
    },
    leftInfo: {
        flex: 1,
        paddingRight: 10,
    },
    name: {
        fontSize: 13,
        color: '#333',
        fontWeight: '500',
    },
    code: {
        fontSize: 10,
        color: '#999',
        marginTop: 2,
        fontFamily: 'monospace', // Pour donner un aspect "code"
    },
    rightInfo: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    noteContainer: {
        flexDirection: 'row',
        alignItems: 'baseline', // Aligne le "20" sur la ligne de base du chiffre
    },
    noteValue: {
        fontSize: 15,
        fontWeight: '700',
    },
    noteTotal: {
        fontSize: 10,
        color: '#BBB',
        marginLeft: 2,
    },
    coeff: {
        fontSize: 11,
        color: '#888',
        marginTop: 2,
    }
}); 