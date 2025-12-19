import { Text, View, StyleSheet } from "react-native";
import MatiereCard from "./afficheMatiere";
import { UeData } from "@/constants/data";

export default function UeCard({ ueData }: { ueData: UeData }) {
    
    // --- GESTION DES COULEURS UE ---
    const getUeColor = (ue: UeData) => {
        // Si pas de moyenne calculée (pas encore de notes), gris
        if (ue.moyenne === null || ue.moyenne === undefined) return "#999";
        
        // Si validé (Moyenne > 10 + Pas de note éliminatoire + Complet) -> VERT
        if (ue.isValidated) return "#4CAF50"; 
        
        // Si Moyenne > 10 MAIS pas validé (Note <= 6 ou incomplet) -> ORANGE
        if (ue.moyenne >= 10) return "#FF9800";

        // Sinon (Moyenne < 10) -> ROUGE
        return "#F44336";
    };

    // --- GESTION DES COULEURS MATIÈRE ---
    const getMatiereColor = (moyenne: number | null | undefined) => {
        if (moyenne === null || moyenne === undefined) return "#999";
        if (moyenne <= 6) return "#F44336"; // Rouge si éliminatoire (<= 6)
        if (moyenne < 10) return "#FF9800"; // Orange si entre 6 et 10
        return "#4CAF50"; // Vert si >= 10
    };

    return (
        <View style={styles.card}>
            {/* Header de l'UE */}
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.ueTitle}>{ueData.ue}</Text>
                    
                    {/* Affichage Moyenne UE */}
                    {ueData.moyenne !== null && ueData.moyenne !== undefined && (
                        <Text style={[styles.ueMoyenne, { color: getUeColor(ueData) }]}>
                            Moyenne UE : {ueData.moyenne.toFixed(2)}/20
                            {/* Petit texte explicatif si > 10 mais bloqué */}
                            {!ueData.isValidated && ueData.moyenne >= 10 ? " (Non Validé)" : ""}
                        </Text>
                    )}
                </View>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{ueData.ects} ECTS</Text>
                </View>
            </View>

            {/* Liste des Matières */}
            <View style={styles.contentContainer}>
                {ueData.matieres.map((matiere, index) => (
                    <View key={matiere.name + index} style={styles.matiereContainer}>
                        
                        {/* En-tête de la matière */}
                        <View style={styles.matiereHeader}>
                            <Text style={styles.matiereName}>{matiere.name}</Text>
                            <View style={styles.matiereInfos}>
                                {matiere.moyenne !== null && matiere.moyenne !== undefined && (
                                    <Text style={[styles.matiereMoy, { color: getMatiereColor(matiere.moyenne) }]}>
                                        {matiere.moyenne.toFixed(2)}
                                    </Text>
                                )}
                                <Text style={styles.matiereCoeff}> (Coeff {matiere.coeff_matiere})</Text>
                            </View>
                        </View>
                        
                        {/* Liste des évaluations */}
                        <MatiereCard evaluationData={matiere.evaluations} />
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 16,
        padding: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    ueTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#222',
        marginRight: 10,
        marginBottom: 4,
    },
    ueMoyenne: {
        fontSize: 13,
        fontWeight: '600',
    },
    badge: {
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    badgeText: {
        color: '#1976D2',
        fontWeight: '700',
        fontSize: 12,
    },
    contentContainer: {
        gap: 16,
    },
    matiereContainer: {},
    matiereHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    matiereName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#444',
        flex: 1,
    },
    matiereInfos: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    matiereMoy: {
        fontWeight: 'bold',
        fontSize: 14,
    },
    matiereCoeff: {
        fontSize: 12,
        color: '#888',
        fontStyle: 'italic',
    }
});