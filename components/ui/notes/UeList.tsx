import { Ue } from "@/types/note";
import { StyleSheet, Text, View } from "react-native";
import MatiereCard from "./MatiereCard";
interface UeCardProps {
    Ue: Ue;
    simulatedNotes: Record<string, number | null>;
    updateSimulation: (id: string, val: number | null) => void;
}

export default function UeCard({ Ue, simulatedNotes, updateSimulation }: UeCardProps) {
    
    const getUeColor = (moyenne: number | null | undefined, isValidated: boolean | undefined) => {
        if (moyenne === null || moyenne === undefined) return "#999";
        if (isValidated) return "#4CAF50"; 
        if (moyenne >= 10) return "#FF9800"; 
        return "#F44336";
    };

    const getMatiereColor = (moyenne: number | null | undefined) => {
        if (moyenne === null || moyenne === undefined) return "#999";
        if (moyenne <= 6) return "#F44336";
        if (moyenne < 10) return "#FF9800";
        return "#4CAF50";
    };

    return (
        <View style={styles.card}>
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

            <View style={styles.contentContainer}>
                {Ue.matieres.map((matiere, index) => (
                    <View key={matiere.name + index} style={styles.matiereContainer}>
                        <View style={styles.matiereHeader}>
                            <Text style={styles.matiereName}>{matiere.name}</Text>
                            <View style={styles.matiereInfos}>
                                <Text style={[styles.matiereMoy, { color: getMatiereColor(matiere.moyenne) }]}>
                                    {matiere.moyenne !== null && matiere.moyenne !== undefined ? matiere.moyenne.toFixed(2) : "--"}
                                </Text>
                                <Text style={styles.matiereCoeff}> (Coeff {matiere.coeff_matiere})</Text>
                            </View>
                        </View>
                        
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
    card: { backgroundColor: 'white', marginHorizontal: 16, marginBottom: 16, borderRadius: 16, padding: 16, elevation: 3 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderColor: '#F0F0F0' },
    ueTitle: { fontSize: 17, fontWeight: '700', color: '#111', marginRight: 10 },
    ueMoyenne: { fontSize: 14, fontWeight: '600' },
    badge: { backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    badgeText: { color: '#1D4ED8', fontWeight: '700', fontSize: 11 },
    contentContainer: { gap: 20 },
    matiereContainer: {},
    matiereHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    matiereName: { fontSize: 15, fontWeight: '600', color: '#444', flex: 1 },
    matiereInfos: { flexDirection: 'row', alignItems: 'center' },
    matiereMoy: { fontWeight: 'bold', fontSize: 15 },
    matiereCoeff: { fontSize: 12, color: '#888', fontStyle: 'italic' }
});