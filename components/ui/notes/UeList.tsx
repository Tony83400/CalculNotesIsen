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
        marginBottom: 20, 
        borderRadius: 24, 
        padding: 16, 
        borderWidth: 1,
        borderColor: Colors.divider,
        // Ombre très douce et diffuse type iOS
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 12,
        elevation: 2,
    },
    cardHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingBottom: 14, 
        borderBottomWidth: 0.5, 
        borderColor: Colors.divider,
        marginBottom: 14,
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    iconContainer: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ueTitle: { 
        fontSize: 15, 
        fontWeight: '700', 
        color: Colors.text.primary,
        letterSpacing: -0.3,
        marginBottom: 2,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 8,
        gap: 3,
    },
    ectsText: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.text.secondary,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 0.5,
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
        paddingLeft: 8,
    },
    moyenneValueContainer: {
        alignItems: 'flex-end',
    },
    ueMoyenne: { 
        fontSize: 18, 
        fontWeight: '800',
        letterSpacing: -0.5,
        lineHeight: 20,
    },
    moyenneLabel: {
        fontSize: 8,
        fontWeight: '700',
        color: Colors.text.tertiary,
        letterSpacing: 0.3,
    },
    matieresList: {
        gap: 12,
    },
    matiereItem: {
        backgroundColor: '#F8FAFC', 
        borderRadius: 16,
        padding: 2, 
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    matiereHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    matiereTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 6,
    },
    matiereName: { 
        fontSize: 13, 
        fontWeight: '600', 
        color: Colors.text.secondary,
        flex: 1,
        letterSpacing: -0.1,
    },
    matiereScoreRow: {
        alignItems: 'flex-end',
        gap: 2,
    },
    matiereMoy: { 
        fontSize: 14,
        fontWeight: '700', 
        letterSpacing: -0.3,
    },
    coeffBadge: {
        backgroundColor: Colors.surface,
        paddingHorizontal: 5,
        paddingVertical: 1.5,
        borderRadius: 6,
        borderWidth: 0.5,
        borderColor: Colors.divider,
    },
    matiereCoeff: { 
        fontSize: 8, 
        color: Colors.text.tertiary, 
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    evaluationsContainer: {
        backgroundColor: Colors.surface,
        borderRadius: 14,
        paddingHorizontal: 10,
        paddingVertical: 2,
    }
});