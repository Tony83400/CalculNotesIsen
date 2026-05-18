import React from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Check, ChevronRight } from "lucide-react-native";
import { Colors } from "@/constants/Colors";

interface MajorSelectorCardProps {
    semester: string;
    majors: string[];
    selectedMajor: string | null;
    onMajorSelect: (semester: string, major: string) => void;
    disabled?: boolean;
}

export const MajorSelectorCard: React.FC<MajorSelectorCardProps> = ({
    semester,
    majors,
    selectedMajor,
    onMajorSelect,
    disabled
}) => {
    return (
        <View style={styles.semesterCard}>
            <View style={styles.semesterHeader}>
                <View style={styles.semesterBadge}>
                    <Text style={styles.semesterBadgeText}>{semester}</Text>
                </View>
                <Text style={styles.semesterSubtitle}>
                    {selectedMajor ? 'Filière sélectionnée' : 'Sélectionnez votre filière'}
                </Text>
            </View>
            
            <View style={styles.majorList}>
                {majors.map((major: string) => (
                    <TouchableOpacity
                        key={major}
                        style={[
                            styles.majorItem,
                            selectedMajor === major && styles.majorItemSelected
                        ]}
                        onPress={() => onMajorSelect(semester, major)}
                        activeOpacity={0.7}
                        disabled={disabled}
                    >
                        <View style={styles.majorContent}>
                            <Text style={[
                                styles.majorText,
                                selectedMajor === major && styles.majorTextSelected
                            ]}>
                                {major}
                            </Text>
                        </View>
                        {selectedMajor === major ? (
                            <View style={styles.majorCheck}>
                                <Check size={14} color={Colors.surface} strokeWidth={3} />
                            </View>
                        ) : (
                            <ChevronRight size={18} color={Colors.text.tertiary} />
                        )}
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    semesterCard: {
        backgroundColor: Colors.surface,
        borderRadius: 28,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 12,
        elevation: 2,
    },
    semesterHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 18,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
    },
    semesterBadge: {
        backgroundColor: Colors.background,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    semesterBadgeText: {
        fontSize: 14,
        fontWeight: '800',
        color: Colors.text.primary,
    },
    semesterSubtitle: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.text.tertiary,
    },
    majorList: {
        gap: 10,
    },
    majorItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 18,
        borderRadius: 18,
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    majorItemSelected: {
        backgroundColor: Colors.primary + '08',
        borderColor: Colors.primary + '20',
    },
    majorContent: {
        flex: 1,
    },
    majorText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text.secondary,
        letterSpacing: -0.2,
    },
    majorTextSelected: {
        color: Colors.primary,
        fontWeight: '700',
    },
    majorCheck: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
