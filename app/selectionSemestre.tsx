import React, { useEffect, useState } from "react";
import {
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ScrollView,
    Dimensions
} from "react-native";
import { router } from "expo-router";
import { 
    GraduationCap, 
    ChevronLeft,
    ArrowRight
} from "lucide-react-native";

import { Colors } from "@/constants/Colors";
import { 
    getId, 
    getSelectedMajors, 
    getSelectedYear,
    setSelectedSemester 
} from "@/services/storage";

const { width } = Dimensions.get('window');

export default function SelectionSemestreScreen() {
    const [selectedYear, setSelectedYear] = useState<string | null>(null);
    const [availableSemesters, setAvailableSemesters] = useState<string[]>([]);
    const [majors, setMajors] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchConfig = async () => {
            const year = await getSelectedYear();
            const semMajors = await getSelectedMajors();
            
            setSelectedYear(year);
            if (semMajors) {
                setMajors(semMajors);
                setAvailableSemesters(Object.keys(semMajors).sort());
            }
        };
        fetchConfig();
    }, []);

    const handleSemesterPress = async (sem: string) => {
        await setSelectedSemester(sem);
        router.push("/notes");
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <ChevronLeft size={24} color={Colors.text.primary} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerSubtitle}>Choix du semestre</Text>
                    <Text style={styles.headerTitle}>{selectedYear || 'Cursus'}</Text>
                </View>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>
                    <Text style={styles.description}>
                        Sélectionnez le semestre que vous souhaitez consulter pour voir vos notes et vos moyennes.
                    </Text>

                    <View style={styles.semesterList}>
                        {availableSemesters.map((sem) => (
                            <TouchableOpacity
                                key={sem}
                                style={styles.semesterCard}
                                onPress={() => handleSemesterPress(sem)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.iconBox, { backgroundColor: Colors.primary + '10' }]}>
                                    <GraduationCap size={32} color={Colors.primary} />
                                </View>
                                <View style={styles.cardMain}>
                                    <View style={styles.semesterBadge}>
                                        <Text style={styles.semesterBadgeText}>{sem}</Text>
                                    </View>
                                    <Text style={styles.majorTitle}>{majors[sem]}</Text>
                                </View>
                                <View style={styles.arrowBox}>
                                    <ArrowRight size={20} color={Colors.primary} />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 20,
        backgroundColor: Colors.background,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: Colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerSubtitle: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text.primary,
        letterSpacing: -0.5,
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        paddingHorizontal: 24,
        paddingTop: 8,
    },
    description: {
        fontSize: 15,
        color: Colors.text.secondary,
        fontWeight: '500',
        lineHeight: 22,
        marginBottom: 32,
        textAlign: 'center',
    },
    semesterList: {
        gap: 16,
    },
    semesterCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: 20,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 3,
    },
    iconBox: {
        width: 60,
        height: 60,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardMain: {
        flex: 1,
    },
    semesterBadge: {
        backgroundColor: Colors.primary + '10',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 6,
    },
    semesterBadgeText: {
        fontSize: 12,
        fontWeight: '800',
        color: Colors.primary,
    },
    majorTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: Colors.text.primary,
        letterSpacing: -0.3,
    },
    arrowBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.primary + '08',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    }
});