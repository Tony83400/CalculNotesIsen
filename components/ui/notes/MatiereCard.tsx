import { Colors } from "@/constants/Colors";
import { Evaluations } from "@/types/note";
import Slider from '@react-native-community/slider';
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface MatiereCardProps {
    evaluationData: Evaluations[];
    simulatedNotes: Record<string, number | null>;
    updateSimulation: (id: string, val: number | null) => void;
}

const getNoteColor = (note: number | undefined | null) => {
    if (note === undefined || note === null) return Colors.status.neutral; // Gris harmonisé
    if (note >= 10) return Colors.status.success;
    if (note >= 8) return Colors.status.warning;
    return Colors.status.error;
};

export default function MatiereCard({ evaluationData, simulatedNotes, updateSimulation }: MatiereCardProps) {
    return (
        <View style={styles.container}>
            {evaluationData.map((item, index) => {
                const isLast = index === evaluationData.length - 1;
                
                // IMPORTANT: On tilise l'ID généré dans main.tsx pour éviter que tout bouge en même temps
                const id = item.uniqueId || item.code || `${item.name}_${index}`;
                
                const displayNote = item.noteReelle;
                const isSimulated = simulatedNotes[id] !== undefined && simulatedNotes[id] !== null;
                const sliderValue = displayNote !== null && displayNote !== undefined ? displayNote : 10;

                // Condition d'affichage du slider : Si PAS de note API, ou si c'est déjà une simulation en cours
                const showSlider = !item.hasApiNote;

                return (
                    <View key={id} style={[styles.row, !isLast && styles.separator]}>
                        
                        <View style={styles.rowTop}>
                            <View style={styles.leftInfo}>
                                <Text style={styles.name}>{item.name}</Text>
                                <Text style={styles.code}>{item.code}</Text>
                            </View>

                            <TouchableOpacity 
                                style={styles.rightInfo}
                                disabled={!isSimulated} // On ne peut reset que les simulations
                                onPress={() => updateSimulation(id, null)}
                            >
                                <View style={styles.noteWrapper}>
                                    <Text style={[
                                        styles.noteValue, 
                                        { color: getNoteColor(displayNote) },
                                        isSimulated && styles.simulatedText
                                    ]}>
                                        {displayNote !== null && displayNote !== undefined ? displayNote.toFixed(2) : "--"}
                                    </Text>
                                    <Text style={styles.noteTotal}>/20</Text>
                                </View>
                                <Text style={styles.coeff}>Coeff {item.coeff}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* On affiche le slider UNIQUEMENT si pas de note API */}
                        {showSlider && (
                            <View style={styles.sliderWrapper}>
                                <Slider
                                    style={{ width: '100%', height: 30 }}
                                    minimumValue={0}
                                    maximumValue={20}
                                    step={0.5}
                                    value={sliderValue}
                                    onValueChange={(val) => updateSimulation(id, val)}
                                    minimumTrackTintColor={isSimulated ? "#2196F3" : "#E0E0E0"}
                                    maximumTrackTintColor="#000000"
                                    thumbTintColor={isSimulated ? "#2196F3" : "#999"}
                                />
                                {isSimulated && (
                                    <Text style={styles.resetHint}>Appuie sur la note pour annuler</Text>
                                )}
                            </View>
                        )}
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
container: { 
        backgroundColor: 'transparent', 
     
        paddingHorizontal: 0, 
        borderRadius: 0 
    },
        row: { paddingVertical: 10 },
separator: { 
        borderBottomWidth: 1, 
        borderBottomColor: Colors.border // Gris de bordure standardisé
    },    rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 },
    leftInfo: { flex: 1, paddingRight: 10 },
    name: { fontSize: 14, color: '#333', fontWeight: '500' },
    code: { fontSize: 10, color: '#AAA', fontFamily: 'monospace' },
    rightInfo: { alignItems: 'flex-end' },
    noteWrapper: { flexDirection: 'row', alignItems: 'baseline' },
    noteValue: { fontSize: 16, fontWeight: '700' },
simulatedText: { 
        color: Colors.status.info, // Bleu harmonisé
        textDecorationLine: 'underline' 
    },    noteTotal: { fontSize: 10, color: '#BBB', marginLeft: 2 },
    coeff: { fontSize: 11, color: '#888' },
    sliderWrapper: { paddingTop: 0 },
    resetHint: { fontSize: 9, color: '#2196F3', textAlign: 'center', marginTop: -5 }
});