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
                                <Text style={styles.code}>{item.code}</Text>
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
                                <View style={styles.coeffBadge}>
                                    <Text style={styles.coeffText}>coeff {item.coeff}</Text>
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
        paddingVertical: 14,
    },
    separator: { 
        borderBottomWidth: 1, 
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
        fontSize: 14, 
        color: Colors.text.primary, 
        fontWeight: '600',
        lineHeight: 20,
    },
    code: { 
        fontSize: 11, 
        color: Colors.text.tertiary, 
        marginTop: 2,
        letterSpacing: 0.5,
    },
    rightInfo: { 
        alignItems: 'flex-end',
        minWidth: 85,
    },
    noteContainer: { 
        flexDirection: 'row', 
        alignItems: 'baseline',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        backgroundColor: Colors.background,
    },
    missingNoteContainer: {
        backgroundColor: Colors.primary + '08',
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: Colors.primary + '30',
    },
    simulatedContainer: {
        backgroundColor: Colors.primary + '10',
        borderWidth: 1,
        borderColor: Colors.primary + '40',
    },
    noteValueRow: { 
        flexDirection: 'row', 
        alignItems: 'center',
    },
    noteValue: { 
        fontSize: 17, 
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    editIcon: {
        marginLeft: 6,
        opacity: 0.9,
    },
    noteInput: { 
        fontSize: 17, 
        fontWeight: '800', 
        padding: 0,
        minWidth: 40,
        textAlign: 'right',
    },
    noteTotal: { 
        fontSize: 11, 
        color: Colors.text.tertiary, 
        marginLeft: 2,
        fontWeight: '600',
    },
    coeffBadge: {
        marginTop: 6,
    },
    coeffText: { 
        fontSize: 10, 
        color: Colors.text.tertiary,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    sliderSection: { 
        marginTop: 12,
        paddingHorizontal: 4,
        backgroundColor: Colors.background,
        paddingVertical: 12,
        borderRadius: 12,
    },
    slider: { 
        width: '100%', 
        height: 30,
    },
    simulationHint: { 
        fontSize: 11, 
        color: Colors.primary, 
        textAlign: 'center', 
        marginTop: -2,
        fontWeight: '600',
    }
});