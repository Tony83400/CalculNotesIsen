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
    if (note === undefined || note === null) return Colors.text.tertiary;
    if (note >= 10) return Colors.status.success;
    if (note >= 8) return Colors.status.warning;
    return Colors.status.error;
};

export default function MatiereCard({ evaluationData, simulatedNotes, updateSimulation }: MatiereCardProps) {
    return (
        <View style={styles.container}>
            {evaluationData.map((item, index) => {
                const isLast = index === evaluationData.length - 1;
                const id = item.uniqueId || item.code || `${item.name}_${index}`;
                const displayNote = item.noteReelle;
                const isSimulated = simulatedNotes[id] !== undefined && simulatedNotes[id] !== null;
                const sliderValue = displayNote !== null && displayNote !== undefined ? displayNote : 10;
                const showSlider = !item.hasApiNote;

                return (
                    <View key={id} style={[styles.row, !isLast && styles.separator]}>
                        
                        <View style={styles.rowTop}>
                            <View style={styles.leftInfo}>
                                <Text style={styles.name}>{item.name}</Text>
                                {item.coeff > 0 && <Text style={styles.coeff}>Coeff {item.coeff}</Text>}
                            </View>

                            <TouchableOpacity
                                style={styles.rightInfo}
                                disabled={!isSimulated}
                                onPress={() => updateSimulation(id, null)}
                            >
                                <View style={styles.noteWrapper}>
                                    <Text style={[
                                        styles.noteValue,
                                        { color: isSimulated ? Colors.status.info : getNoteColor(displayNote) }
                                    ]}>
                                        {displayNote !== null && displayNote !== undefined ? displayNote.toFixed(2) : "--"}
                                    </Text>
                                    <Text style={[styles.noteTotal, {color: isSimulated ? Colors.status.info : Colors.text.tertiary}]}>/20</Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        {showSlider && (
                            <View style={styles.sliderWrapper}>
                                <Slider
                                    style={{ width: '100%', height: 30 }}
                                    minimumValue={0}
                                    maximumValue={20}
                                    step={0.5}
                                    value={sliderValue}
                                    onValueChange={(val) => updateSimulation(id, val)}
                                    minimumTrackTintColor={isSimulated ? Colors.status.info : Colors.border}
                                    maximumTrackTintColor={Colors.border}
                                    thumbTintColor={isSimulated ? Colors.status.info : Colors.text.secondary}
                                />
                                {isSimulated && (
                                    <Text style={styles.resetHint}>Appuyez sur la note pour annuler</Text>
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
    },
    row: {
        paddingVertical: 12,
    },
    separator: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    rowTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center', // Vertically align items
        marginBottom: 4,
        minHeight: 44, // Ensure minimum touch target size
    },
    leftInfo: {
        flex: 1,
        paddingRight: 8,
    },
    name: {
        fontSize: 16, // Main text size
        color: Colors.text.primary,
        fontWeight: '500',
    },
    coeff: {
        fontSize: 12,
        color: Colors.text.secondary,
        fontStyle: 'italic',
        marginTop: 2,
    },
    rightInfo: {
        alignItems: 'flex-end',
    },
    noteWrapper: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    noteValue: {
        fontSize: 16, // Main text size
        fontWeight: '700',
        fontFamily: 'monospace', // Gives a tabular feel
    },
    noteTotal: {
        fontSize: 12,
        fontWeight: '500',
        fontFamily: 'monospace',
        marginLeft: 2,
    },
    sliderWrapper: {
        paddingTop: 4,
    },
    resetHint: {
        fontSize: 11,
        color: Colors.status.info,
        textAlign: 'center',
        marginTop: 2,
    }
});