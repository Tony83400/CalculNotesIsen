import React from "react";
import { Colors } from "@/constants/Colors";
import { Evaluations } from "@/types/note";
import Slider from '@react-native-community/slider';
import { StyleSheet, Text, TouchableOpacity, View, TextInput } from "react-native";

interface MatiereCardProps {
    evaluationData: Evaluations[];
    simulatedNotes: Record<string, number | null>;
    updateSimulation: (id: string, val: number | null) => void;
}

const getNoteColor = (note: number | undefined | null) => {
    if (note === undefined || note === null) return Colors.status.neutral;
    if (note >= 10) return Colors.status.success;
    if (note >= 8) return Colors.status.warning;
    return Colors.status.error;
};

export default function MatiereCard({ evaluationData, simulatedNotes, updateSimulation }: MatiereCardProps) {
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [tempValue, setTempValue] = React.useState<string>("");

    return (
        <View style={styles.container}>
            {evaluationData.map((item, index) => {
                const isLast = index === evaluationData.length - 1;
                const id = item.uniqueId || item.code || `${item.name}_${index}`;
                
                const displayNote = item.noteReelle;
                const isSimulated = simulatedNotes[id] !== undefined && simulatedNotes[id] !== null;
                const sliderValue = displayNote !== null && displayNote !== undefined ? displayNote : 10;

                const showSlider = !item.hasApiNote || isSimulated || editingId === id;

                const handlePressNote = () => {
                    if (isSimulated && editingId !== id) {
                        // Si c'est déjà simulé mais qu'on ne l'éditait pas, on reset
                        updateSimulation(id, null);
                        setEditingId(null);
                        setTempValue("");
                    } else {
                        // Sinon on active le mode édition
                        setEditingId(id);
                        setTempValue(displayNote !== null && displayNote !== undefined ? displayNote.toString() : "");
                    }
                };

                const handleTextChange = (val: string) => {
                    // On accepte les virgules et les points
                    const formattedVal = val.replace(',', '.');
                    setTempValue(formattedVal);
                    
                    const n = parseFloat(formattedVal);
                    if (!isNaN(n) && n >= 0 && n <= 20) {
                        updateSimulation(id, n);
                    }
                };

                return (
                    <View key={id} style={[styles.row, !isLast && styles.separator]}>
                        
                        <View style={styles.rowTop}>
                            <View style={styles.leftInfo}>
                                <Text style={styles.name}>{item.name}</Text>
                                <Text style={styles.code}>{item.code}</Text>
                            </View>

                            <TouchableOpacity 
                                style={styles.rightInfo}
                                onPress={handlePressNote}
                                activeOpacity={0.7}
                            >
                                <View style={styles.noteWrapper}>
                                    {editingId === id ? (
                                        <TextInput
                                            style={[
                                                styles.noteInput,
                                                { color: getNoteColor(displayNote) }
                                            ]}
                                            value={tempValue}
                                            onChangeText={handleTextChange}
                                            keyboardType="decimal-pad"
                                            autoFocus
                                            onBlur={() => setEditingId(null)}
                                            selectTextOnFocus
                                        />
                                    ) : (
                                        <Text style={[
                                            styles.noteValue, 
                                            { color: getNoteColor(displayNote) },
                                            isSimulated && styles.simulatedText
                                        ]}>
                                            {displayNote !== null && displayNote !== undefined ? displayNote.toFixed(2) : "--"}
                                        </Text>
                                    )}
                                    <Text style={styles.noteTotal}>/20</Text>
                                </View>
                                <Text style={styles.coeff}>Coeff {item.coeff}</Text>
                            </TouchableOpacity>
                        </View>

                        {showSlider && (
                            <View style={styles.sliderWrapper}>
                                <Slider
                                    style={{ width: '100%', height: 30 }}
                                    minimumValue={0}
                                    maximumValue={20}
                                    step={0.1}
                                    value={sliderValue}
                                    onValueChange={(val) => {
                                        updateSimulation(id, val);
                                        setTempValue(val.toString());
                                    }}
                                    minimumTrackTintColor={isSimulated ? Colors.status.info : "#E0E0E0"}
                                    maximumTrackTintColor="#000000"
                                    thumbTintColor={isSimulated ? Colors.status.info : "#999"}
                                />
                                <Text style={styles.resetHint}>
                                    {isSimulated ? "Appuie sur la note pour annuler" : "Bouge le curseur ou clique sur la note pour taper"}
                                </Text>
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
        borderBottomColor: Colors.border 
    },
    rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 },
    leftInfo: { flex: 1, paddingRight: 10 },
    name: { fontSize: 14, color: '#333', fontWeight: '500' },
    code: { fontSize: 10, color: '#AAA', fontFamily: 'monospace' },
    rightInfo: { alignItems: 'flex-end' },
    noteWrapper: { flexDirection: 'row', alignItems: 'baseline' },
    noteValue: { fontSize: 16, fontWeight: '700' },
    noteInput: { 
        fontSize: 16, 
        fontWeight: '700', 
        borderBottomWidth: 1, 
        borderBottomColor: Colors.status.info,
        padding: 0,
        minWidth: 40,
        textAlign: 'right'
    },
    simulatedText: { 
        color: Colors.status.info, 
        textDecorationLine: 'underline' 
    },
    noteTotal: { fontSize: 10, color: '#BBB', marginLeft: 2 },
    coeff: { fontSize: 11, color: '#888' },
    sliderWrapper: { paddingTop: 0 },
    resetHint: { fontSize: 9, color: '#2196F3', textAlign: 'center', marginTop: -5 }
});