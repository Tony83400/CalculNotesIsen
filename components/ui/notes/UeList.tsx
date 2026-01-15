import { Ue } from "@/types/note";
import { StyleSheet, Text, View } from "react-native";
import MatiereCard from "./MatiereCard";
import { Colors } from "@/constants/Colors"; // Assure-toi d'avoir créé ce fichier

interface UeCardProps {
    Ue: Ue;
    simulatedNotes: Record<string, number | null>;
    updateSimulation: (id: string, val: number | null) => void;
}

export default function UeCard({ Ue, simulatedNotes, updateSimulation }: UeCardProps) {
    
    const getUeColor = (moyenne: number | null | undefined, isValidated: boolean | undefined) => {
        if (moyenne === null || moyenne === undefined) return Colors.status.neutral;
        if (isValidated) return Colors.status.success; 
        if (moyenne >= 10) return Colors.status.warning; 
        return Colors.status.error;
    };

    const getMatiereColor = (moyenne: number | null | undefined) => {
        if (moyenne === null || moyenne === undefined) return Colors.status.neutral;
        if (moyenne <= 6) return Colors.status.error;
        if (moyenne < 10) return Colors.status.warning;
        return Colors.status.success;
    };

    return (
        <View style={styles.card}>
            {/* Header de l'UE (inchangé) */}
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.ueTitle}>{Ue.ue}</Text>
                    {Ue.moyenne !== null && Ue.moyenne !== undefined ? (
                        <Text style={[styles.ueMoyenne, { color: getUeColor(Ue.moyenne, Ue.isValidated) }]}>
                            Moyenne UE : {Ue.moyenne.toFixed(2)}/20
                            {!Ue.isValidated && Ue.moyenne >= 10 ? " (Non Validé)" : ""}
                        </Text>
                    ) : (
                        <Text style={styles.ueMoyenne}>--/20</Text>
                    )}
                </View>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{Ue.ects} ECTS</Text>
                </View>
            </View>

            {/* Conteneur des matières */}
            <View style={styles.contentContainer}>
                {Ue.matieres.map((matiere, index) => (
                    // ICI : On applique un style "bloc" pour séparer chaque matière
                    <View key={matiere.name + index} style={styles.matiereBlock}>
                        
                        <View style={styles.matiereHeader}>
                            <Text style={styles.matiereName}>{matiere.name}</Text>
                            <View style={styles.matiereInfos}>
                                <Text style={[styles.matiereMoy, { color: getMatiereColor(matiere.moyenne) }]}>
                                    {matiere.moyenne !== null && matiere.moyenne !== undefined ? matiere.moyenne.toFixed(2) : "--"}
                                </Text>
                                <Text style={styles.matiereCoeff}> (Coeff {matiere.coeff_matiere})</Text>
                            </View>
                        </View>
                        
                        {/* On passe une prop pour dire à la card de se fondre dans le bloc */}
                        <MatiereCard 
                            evaluationData={matiere.evaluations}
                            simulatedNotes={simulatedNotes}
                            updateSimulation={updateSimulation}
                        />
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: { 
        backgroundColor: Colors.surface, 
        marginHorizontal: 16, 
        marginBottom: 16, 
        borderRadius: 16, 
        padding: 16, 
        // Ombres douces uniformisées
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        marginBottom: 16, 
        paddingBottom: 12, 
        borderBottomWidth: 1, 
        borderColor: Colors.border 
    },
    ueTitle: { 
        fontSize: 17, 
        fontWeight: '700', 
        color: Colors.text.primary, 
        marginRight: 10 
    },
    ueMoyenne: { 
        fontSize: 14, 
        fontWeight: '600',
        marginTop: 2
    },
    badge: { 
        backgroundColor: Colors.primaryLight, 
        paddingHorizontal: 8, 
        paddingVertical: 4, 
        borderRadius: 6,
        alignSelf: 'flex-start'
    },
    badgeText: { 
        color: Colors.primary, 
        fontWeight: '700', 
        fontSize: 11 
    },
    contentContainer: { 
        gap: 12 // Espace entre les blocs de matières
    },
    
    // NOUVEAU STYLE : Le bloc qui contient toute la matière
    matiereBlock: {
        backgroundColor: Colors.background, // Gris très clair (#F2F5F8)
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: Colors.border, // Bordure subtile
    },
    
    matiereHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 10,
        paddingBottom: 8,
        borderBottomWidth: 1, // Séparation titre matière / notes
        borderBottomColor: '#E0E0E0', // Légèrement plus foncé que le border global
        borderStyle: 'dashed' // Optionnel : style pointillé pour différencier du header UE
    },
    matiereName: { 
        fontSize: 15, 
        fontWeight: '700', // Un peu plus gras pour ressortir
        color: Colors.text.primary, 
        flex: 1 
    },
    matiereInfos: { 
        flexDirection: 'row', 
        alignItems: 'center' 
    },
    matiereMoy: { 
        fontWeight: 'bold', 
        fontSize: 15 
    },
    matiereCoeff: { 
        fontSize: 12, 
        color: Colors.text.tertiary, 
        fontStyle: 'italic' 
    }
});