import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Award, BookOpen, GraduationCap, ChevronDown, ChevronRight } from "lucide-react-native";
import { Ue } from "@/types/note";
import MatiereCard from "./MatiereCard";
import { Colors } from "@/constants/Colors";

interface MatiereSectionProps {
    matiere: any;
    simulatedNotes: Record<string, number | null>;
    updateSimulation: (id: string, val: number | null) => void;
    getMatiereColor: (moyenne: number | null | undefined) => string;
}

const MatiereSection: React.FC<MatiereSectionProps> = ({
    matiere,
    simulatedNotes,
    updateSimulation,
    getMatiereColor
}) => {
    const [expanded, setExpanded] = React.useState(false);
    
    const hasActiveSimulation = React.useMemo(() => {
        return matiere.evaluations.some((ev: any) => {
            const id = ev.uniqueId || ev.code || `${ev.name}_index`;
            return simulatedNotes[id] !== undefined && simulatedNotes[id] !== null;
        });
    }, [matiere.evaluations, simulatedNotes]);

    React.useEffect(() => {
        if (hasActiveSimulation) {
            setExpanded(true);
        }
    }, [hasActiveSimulation]);

    return (
        <View style={styles.matiereItem}>
            <TouchableOpacity
                onPress={() => setExpanded(!expanded)}
                activeOpacity={0.7}
                style={styles.matiereHeader}
            >
                <View style={styles.matiereTitleRow}>
                    {expanded ? (
                        <ChevronDown size={16} color={Colors.text.tertiary} style={{ marginRight: 4 }} />
                    ) : (
                        <ChevronRight size={16} color={Colors.text.tertiary} style={{ marginRight: 4 }} />
                    )}
                    <BookOpen size={14} color={Colors.text.tertiary} />
                    <Text style={styles.matiereName} numberOfLines={1}>{matiere.name}</Text>
                </View>
                <View style={styles.matiereScoreRow}>
                    <Text style={[styles.matiereMoy, { color: getMatiereColor(matiere.moyenne) }]}>
                        {matiere.moyenne !== null && matiere.moyenne !== undefined ? matiere.moyenne.toFixed(2) : "--"}
                    </Text>
                    <View style={styles.coeffBadge}>
                        <Text style={styles.matiereCoeff}>coeff {matiere.coeff_matiere}</Text>
                    </View>
                </View>
            </TouchableOpacity>
            
            {expanded && (
                <View style={styles.evaluationsContainer}>
                    <MatiereCard 
                        evaluationData={matiere.evaluations}
                        simulatedNotes={simulatedNotes}
                        updateSimulation={updateSimulation}
                    />
                </View>
            )}
        </View>
    );
};

interface UeCardProps {
    Ue: Ue;
    simulatedNotes: Record<string, number | null>;
    updateSimulation: (id: string, val: number | null) => void;
}

export default function UeCard({ Ue, simulatedNotes, updateSimulation }: UeCardProps) {
    
    const getUeColor = (moyenne: number | null | undefined, isValidated: boolean | undefined, hasEliminatoryNote: boolean | undefined) => {
        if (moyenne === null || moyenne === undefined) return Colors.text.tertiary;
        if (isValidated) return Colors.status.success; 
        if (hasEliminatoryNote) return Colors.status.error;
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
        if (Ue.hasEliminatoryNote) return "ÉLIMINATOIRE";
        if (Ue.moyenne < 10) return "NON VALIDÉ";
        return "NON VALIDÉ";
    };

    const statusText = getUeStatusText(Ue);
    const ueColor = getUeColor(Ue.moyenne, Ue.isValidated, Ue.hasEliminatoryNote);

    return (
        <View style={styles.card}>
            {/* Header de l'UE : Premium & Aéré */}
            <View style={styles.cardHeader}>
                <View style={styles.headerTitleRow}>
                    <View style={styles.iconContainer}>
                        <GraduationCap size={20} color={Colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.ueTitle} numberOfLines={1}>{Ue.ue}</Text>
                        <View style={styles.statsRow}>
                            <View style={styles.statBadge}>
                                <Award size={12} color={Colors.text.secondary} />
                                <Text style={styles.ectsText}>{Ue.ects} ECTS</Text>
                            </View>
                            {statusText && (
                                <View style={[styles.statusBadge, { backgroundColor: ueColor + '10', borderColor: ueColor + '30' }]}>
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
                            <Text style={styles.moyenneLabel}>MOY.</Text>
                        </View>
                    ) : (
                        <View style={styles.moyenneValueContainer}>
                            <Text style={[styles.ueMoyenne, { color: Colors.text.tertiary }]}>--</Text>
                            <Text style={styles.moyenneLabel}>MOY.</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Liste des matières : Subtilement imbriquée */}
            <View style={styles.matieresList}>
                {Ue.matieres.map((matiere, index) => (
                    <MatiereSection
                        key={matiere.name + index}
                        matiere={matiere}
                        simulatedNotes={simulatedNotes}
                        updateSimulation={updateSimulation}
                        getMatiereColor={getMatiereColor}
                    />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: { 
        backgroundColor: Colors.surface, 
        marginHorizontal: 16, 
        marginBottom: 24, 
        borderRadius: 24, 
        padding: 20, 
        borderWidth: 1,
        borderColor: Colors.border,
        // Ombre très douce type Apple
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 3,
    },
    cardHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingBottom: 20, 
        borderBottomWidth: 1, 
        borderColor: Colors.divider,
        marginBottom: 20,
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 14,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ueTitle: { 
        fontSize: 17, 
        fontWeight: '800', 
        color: Colors.text.primary,
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    ectsText: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.text.secondary,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        gap: 5,
    },
    statusDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
    },
    statusText: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    moyenneContainer: {
        alignItems: 'flex-end',
        paddingLeft: 12,
    },
    moyenneValueContainer: {
        alignItems: 'flex-end',
    },
    ueMoyenne: { 
        fontSize: 22, 
        fontWeight: '800',
        letterSpacing: -1,
        lineHeight: 24,
    },
    moyenneLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: Colors.text.tertiary,
        letterSpacing: 0.5,
    },
    matieresList: {
        gap: 16,
    },
    matiereItem: {
        backgroundColor: Colors.background, 
        borderRadius: 16,
        padding: 2, 
        borderWidth: 1.5, // Un peu plus épais pour la distinction
        borderColor: Colors.divider,
    },
    matiereHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    matiereTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 8,
    },
    matiereName: { 
        fontSize: 14, 
        fontWeight: '700', 
        color: Colors.text.secondary,
        flex: 1,
        letterSpacing: -0.2,
    },
    matiereScoreRow: {
        alignItems: 'flex-end',
        gap: 4,
    },
    matiereMoy: { 
        fontSize: 16,
        fontWeight: '800', 
        letterSpacing: -0.5,
    },
    coeffBadge: {
        backgroundColor: Colors.surface,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    matiereCoeff: { 
        fontSize: 9, 
        color: Colors.text.tertiary, 
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    evaluationsContainer: {
        backgroundColor: Colors.surface,
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 4,
    }
});