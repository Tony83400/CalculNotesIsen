import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Award, BookOpen, GraduationCap } from "lucide-react-native";
import { Ue } from "@/types/note";
import MatiereCard from "./MatiereCard";
import { Colors } from "@/constants/Colors";

interface UeCardProps {
    Ue: Ue;
    simulatedNotes: Record<string, number | null>;
    updateSimulation: (id: string, val: number | null) => void;
}

export default function UeCard({ Ue, simulatedNotes, updateSimulation }: UeCardProps) {
    
    const getUeColor = (moyenne: number | null | undefined, isValidated: boolean | undefined, hasEliminatoryNote: boolean | undefined) => {
        if (moyenne === null || moyenne === undefined) return Colors.text.tertiary;
        if (isValidated) return Colors.status.success; 
        if (hasEliminatoryNote) return Colors.status.error; // Rouge si une matière < 6
        if (moyenne >= 10) return Colors.status.warning; 
        return Colors.status.error;
    };

    const getMatiereColor = (moyenne: number | null | undefined) => {
        if (moyenne === null || moyenne === undefined) return Colors.text.tertiary;
        if (moyenne < 6) return Colors.status.error;
        if (moyenne < 10) return Colors.status.warning;
        return Colors.status.success;
    };

    const getUeStatusText = (Ue: Ue) => {
        if (Ue.moyenne === null || Ue.moyenne === undefined) return null;
        if (Ue.isValidated) return "VALIDÉ";
        if (Ue.hasEliminatoryNote) return "MATIÈRE ÉLIMINATOIRE";
        if (Ue.moyenne < 10) return "MOYENNE INSUFFISANTE";
        return "NON VALIDÉ";
    };

    const statusText = getUeStatusText(Ue);
    const ueColor = getUeColor(Ue.moyenne, Ue.isValidated, Ue.hasEliminatoryNote);

    return (
        <View style={styles.card}>
            {/* Header de l'UE : Épuré et Professionnel */}
            <View style={styles.cardHeader}>
                <View style={styles.headerTitleRow}>
                    <View style={styles.iconContainer}>
                        <GraduationCap size={18} color={Colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.ueTitle} numberOfLines={1}>{Ue.ue}</Text>
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Award size={12} color={Colors.text.tertiary} />
                                <Text style={styles.ectsText}>{Ue.ects} ECTS</Text>
                            </View>
                            {statusText && (
                                <View style={[styles.statusBadge, { backgroundColor: ueColor + '15' }]}>
                                    <View style={[styles.statusDot, { backgroundColor: ueColor }]} />
                                    <Text style={[styles.statusText, { color: ueColor }]}>
                                        {statusText}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                <View style={styles.moyenneContainer}>
                    {Ue.moyenne !== null && Ue.moyenne !== undefined ? (
                        <View style={styles.moyenneValueContainer}>
                            <Text style={[styles.ueMoyenne, { color: ueColor }]}>
                                {Ue.moyenne.toFixed(2)}
                            </Text>
                            <Text style={styles.moyenneLabel}>MOYENNE</Text>
                        </View>
                    ) : (
                        <View style={styles.moyenneValueContainer}>
                            <Text style={[styles.ueMoyenne, { color: Colors.text.tertiary }]}>--</Text>
                            <Text style={styles.moyenneLabel}>MOYENNE</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Liste des matières */}
            <View style={styles.matieresList}>
                {Ue.matieres.map((matiere, index) => (
                    <View key={matiere.name + index} style={styles.matiereItem}>
                        <View style={styles.matiereHeader}>
                            <View style={styles.matiereTitleRow}>
                                <BookOpen size={14} color={Colors.text.secondary} />
                                <Text style={styles.matiereName}>{matiere.name}</Text>
                            </View>
                            <View style={styles.matiereScoreRow}>
                                <Text style={[styles.matiereMoy, { color: getMatiereColor(matiere.moyenne) }]}>
                                    {matiere.moyenne !== null && matiere.moyenne !== undefined ? matiere.moyenne.toFixed(2) : "--"}
                                </Text>
                                <Text style={styles.matiereCoeff}>×{matiere.coeff_matiere}</Text>
                            </View>
                        </View>
                        
                        <View style={styles.evaluationsContainer}>
                            <MatiereCard 
                                evaluationData={matiere.evaluations}
                                simulatedNotes={simulatedNotes}
                                updateSimulation={updateSimulation}
                            />
                        </View>
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
        marginBottom: 20, 
        borderRadius: 20, 
        padding: 16, 
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingBottom: 16, 
        borderBottomWidth: 1, 
        borderColor: Colors.divider,
        marginBottom: 16,
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ueTitle: { 
        fontSize: 16, 
        fontWeight: '700', 
        color: Colors.text.primary,
        letterSpacing: -0.5,
    },
    statsRow: {
        flexDirection: 'row',
        marginTop: 2,
        gap: 12,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ectsText: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.text.secondary,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        gap: 4,
    },
    statusDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
    },
    statusText: {
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    moyenneContainer: {
        alignItems: 'flex-end',
        paddingLeft: 12,
    },
    moyenneValueContainer: {
        alignItems: 'center',
    },
    ueMoyenne: { 
        fontSize: 18, 
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    moyenneLabel: {
        fontSize: 8,
        fontWeight: '700',
        color: Colors.text.tertiary,
        marginTop: -2,
    },
    matieresList: {
        gap: 20,
    },
    matiereItem: {
        backgroundColor: Colors.status.neutral, // Plus foncé pour mieux séparer les matières
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: Colors.divider,
    },
    matiereHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    matiereTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 8,
        paddingTop: 2,
    },
    matiereName: { 
        fontSize: 14, 
        fontWeight: '600', 
        color: Colors.text.primary,
        flex: 1,
    },
    matiereScoreRow: {
        alignItems: 'flex-end',
    },
    matiereMoy: { 
        fontSize: 15,
        fontWeight: '700', 
    },
    matiereCoeff: { 
        fontSize: 10, 
        color: Colors.text.tertiary, 
        fontWeight: '500',
    },
    evaluationsContainer: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: Colors.divider,
    }
});