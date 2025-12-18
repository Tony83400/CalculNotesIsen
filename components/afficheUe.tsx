import {
    Text,
    View,
    StyleSheet,
    FlatList
} from "react-native";
import MatiereCard from "./afficheMatiere";
import { UeData } from "@/constants/data"; // Assure-toi que ce type existe

export default function UeCard({ ueData }: { ueData: UeData }) {
    return (
        <View style={styles.card}>
            {/* Header de l'UE */}
            <View style={styles.cardHeader}>
                <Text style={styles.ueTitle}>{ueData.ue}</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{ueData.ects} ECTS</Text>
                </View>
            </View>

            {/* Liste des Matières */}
            <FlatList 
                data={ueData.matieres}
                keyExtractor={(item, index) => item.name || index.toString()}
                renderItem={({ item }) => (
                    <View style={styles.matiereContainer}>
                        {/* Ligne Titre de la matière */}
                        <View style={styles.matiereHeader}>
                            <Text style={styles.matiereName}>{item.name}</Text>
                            <Text style={styles.matiereCoeff}>Coeff {item.coeff_matiere}</Text>
                        </View>
                        
                        {/* Liste des évaluations de cette matière */}
                        <MatiereCard evaluationData={item.evaluations} />
                    </View>
                )}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        marginHorizontal: 20,
        marginBottom: 15,
        borderRadius: 12,
        padding: 15,
        // Ombre légère (Shadow)
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    ueTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        flex: 1, // Pour que le texte ne passe pas sur le badge
        marginRight: 10,
    },
    badge: {
        backgroundColor: '#E3F2FD', // Bleu très clair
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        color: '#2196F3',
        fontWeight: 'bold',
        fontSize: 12,
    },
    // Styles pour la partie Matière
    matiereContainer: {
        marginTop: 10,
    },
    matiereHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    matiereName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#444',
    },
    matiereCoeff: {
        fontSize: 12,
        color: '#888',
        fontStyle: 'italic',
    }
});