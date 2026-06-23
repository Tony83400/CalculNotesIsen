import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, TextInput } from "react-native";
import Slider from '@react-native-community/slider';
import { Pencil, RotateCcw } from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import { Evaluations } from "@/types/note";

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
                        updateSimulation(id, null);
                        setEditingId(null);
                        setTempValue("");
                    } else {
                        setEditingId(id);
                        const currentVal = displayNote !== null && displayNote !== undefined ? displayNote : 10;
                        setTempValue(currentVal.toString());
                        
                        if (!isSimulated) {
                            updateSimulation(id, currentVal);
                        }
                    }
                };

                const handleTextChange = (val: string) => {
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
                                <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
                                <View style={styles.coeffBadge}>
                                    <Text style={styles.coeffText}>coeff {item.coeff}</Text>
                                </View>
                            </View>

                            <TouchableOpacity 
                                style={styles.rightInfo}
                                onPress={handlePressNote}
                                activeOpacity={0.6}
                            >
                                <View style={[
                                    styles.noteContainer,
                                    !item.hasApiNote && !isSimulated && styles.missingNoteContainer,
                                    isSimulated && styles.simulatedContainer
                                ]}>
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
                                        <View style={styles.noteValueRow}>
                                            <Text style={[
                                                styles.noteValue, 
                                                { color: getNoteColor(displayNote) },
                                                !item.hasApiNote && !isSimulated && { color: Colors.primary }
                                            ]}>
                                                {displayNote !== null && displayNote !== undefined ? displayNote.toFixed(2) : "--"}
                                            </Text>
                                            {!item.hasApiNote && !isSimulated && (
                                                <Pencil size={12} color={Colors.primary} style={styles.editIcon} />
                                            )}
                                            {isSimulated && (
                                                <RotateCcw size={12} color={Colors.primary} style={styles.editIcon} />
                                            )}
                                        </View>
                                    )}
                                    <Text style={styles.noteTotal}>/20</Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        {showSlider && (
                            <View style={styles.sliderSection}>
                                <Slider
                                    style={styles.slider}
                                    minimumValue={0}
                                    maximumValue={20}
                                    step={0.1}
                                    value={sliderValue}
                                    onValueChange={(val) => {
                                        updateSimulation(id, val);
                                        setTempValue(val.toFixed(1));
                                    }}
                                    minimumTrackTintColor={Colors.primary}
                                    maximumTrackTintColor={Colors.border}
                                    thumbTintColor={Colors.primary}
                                />
                                <Text style={styles.simulationHint}>
                                    {isSimulated ? "Simulation active • Tapez pour annuler" : "Glissez pour simuler votre note"}
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
    },
    row: { 
        paddingVertical: 10,
    },
    separator: { 
        borderBottomWidth: 0.5, 
        borderBottomColor: Colors.divider,
    },
    rowTop: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
    },
    leftInfo: { 
        flex: 1, 
        marginRight: 16,
    },
    name: { 
        fontSize: 13, 
        color: Colors.text.primary, 
        fontWeight: '600',
        lineHeight: 18,
    },
    rightInfo: { 
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 70,
    },
    noteContainer: { 
        flexDirection: 'row', 
        alignItems: 'baseline',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: '#F8FAFC',
        borderWidth: 0.5,
        borderColor: Colors.divider,
    },
    missingNoteContainer: {
        backgroundColor: Colors.primary + '04',
        borderWidth: 0.5,
        borderStyle: 'dashed',
        borderColor: Colors.primary + '20',
    },
    simulatedContainer: {
        backgroundColor: Colors.primary + '08',
        borderWidth: 0.5,
        borderColor: Colors.primary + '30',
    },
    noteValueRow: { 
        flexDirection: 'row', 
        alignItems: 'center',
    },
    noteValue: { 
        fontSize: 14, 
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    editIcon: {
        marginLeft: 4,
        opacity: 0.8,
    },
    noteInput: { 
        fontSize: 14, 
        fontWeight: '700', 
        padding: 0,
        minWidth: 30,
        textAlign: 'right',
    },
    noteTotal: { 
        fontSize: 9, 
        color: Colors.text.tertiary, 
        marginLeft: 2,
        fontWeight: '600',
    },
    coeffBadge: {
        marginTop: 4,
        alignSelf: 'flex-start',
        backgroundColor: '#E2E8F0',
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 5,
    },
    coeffText: { 
        fontSize: 8, 
        color: Colors.text.secondary, 
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    sliderSection: { 
        marginTop: 10,
        paddingHorizontal: 8,
        backgroundColor: '#F8FAFC',
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: '#F1F5F9',
    },
    slider: { 
        width: '100%', 
        height: 24,
    },
    simulationHint: { 
        fontSize: 10, 
        color: Colors.primary, 
        textAlign: 'center', 
        marginTop: 2,
        fontWeight: '600',
    }
});