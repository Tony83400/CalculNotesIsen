import React, { useEffect, useState } from "react";
import {
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ScrollView,
    ActivityIndicator,
    Alert
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { 
    Calendar,
    Layers,
    ArrowRight
} from "lucide-react-native";

import { Colors } from "@/constants/Colors";
import { 
    getSelectedYear, 
    setSelectedYear, 
    getSelectedMajors, 
    setSelectedMajors,
    setSelectedMajorsUrls,
    setSelectedSemester,
    isTokenExpired,
    canSilentLogin
} from "@/services/storage";
import { updateStructureConfig, fetchSemesterStructure } from "@/services/configApi";
import bundledStructure from "@/structures_notes/structure.json";
import { YearSelectorButton } from "@/components/ui/selection/YearSelectorButton";
import { MajorSelectorCard } from "@/components/ui/selection/MajorSelectorCard";

export default function SelectionAnneeScreen() {
    const [loading, setLoading] = useState(true);
    const [loadingSaving, setLoadingSaving] = useState(false);
    const [structure, setStructure] = useState<any>(bundledStructure);
    const [selectedYear, setSelectedYearState] = useState<string | null>(null);
    const [selectedMajors, setSelectedMajorsState] = useState<Record<string, string>>({});

    const years = Object.keys(structure.annee);

    useFocusEffect(
        React.useCallback(() => {
            const checkSession = async () => {
                const expired = await isTokenExpired();
                const canSilent = await canSilentLogin();
                if (expired && !canSilent) {
                    router.replace("/");
                }
            };
            checkSession();
        }, [])
    );

    useEffect(() => {
        const loadInitialData = async () => {
            const freshStructure = await updateStructureConfig();
            if (freshStructure) setStructure(freshStructure);

            const year = await getSelectedYear();
            const majors = await getSelectedMajors();
            
            if (year) setSelectedYearState(year);
            if (majors) setSelectedMajorsState(majors);
            
            setLoading(false);
        };
        loadInitialData();
    }, []);

    const handleYearSelect = (year: string) => {
        setSelectedYearState(year);
        const currentYearData = structure.annee[year];
        const semesters = Object.keys(currentYearData);
        
        const newMajors: Record<string, string> = {};
        semesters.forEach(s => {
            const availableMajors = Object.keys(currentYearData[s]);
            if (selectedMajors[s] && availableMajors.includes(selectedMajors[s])) {
                newMajors[s] = selectedMajors[s];
            }
        });
        setSelectedMajorsState(newMajors);
    };

    const handleMajorSelect = (semester: string, major: string) => {
        const newMajors = { ...selectedMajors, [semester]: major };
        
        if (selectedYear) {
            const currentYearData = structure.annee[selectedYear];
            Object.keys(currentYearData).forEach(s => {
                if (s !== semester && currentYearData[s][major]) {
                    newMajors[s] = major;
                }
            });
        }
        
        setSelectedMajorsState(newMajors);
    };

    const handleSave = async () => {
        if (!selectedYear) return;
        
        setLoadingSaving(true);
        try {
            const currentYearData = structure.annee[selectedYear];
            const semesters = Object.keys(currentYearData);
            const urls: Record<string, string> = {};
            
            const missing = semesters.find(s => !selectedMajors[s]);
            if (missing) {
                Alert.alert("Configuration incomplète", `Veuillez sélectionner une filière pour le semestre ${missing}.`);
                setLoadingSaving(false);
                return;
            }

            for (const s of semesters) {
                const major = selectedMajors[s];
                const url = currentYearData[s][major];
                urls[s] = url;
                
                const data = await fetchSemesterStructure(s, url);
                if (!data) {
                    throw new Error(`Erreur lors du téléchargement de la structure pour ${s} (${major})`);
                }
            }

            await setSelectedYear(selectedYear);
            await setSelectedMajors(selectedMajors);
            await setSelectedMajorsUrls(urls);
            
            const month = new Date().getMonth();
            const defaultSemester = (month >= 8 || month <= 0) ? semesters[0] : (semesters[1] || semesters[0]);
            await setSelectedSemester(defaultSemester);

            router.replace("/selection");
        } catch (error: any) {
            console.error("Save error:", error);
            Alert.alert("Erreur", error.message || "Une erreur est survenue lors de la sauvegarde.");
        } finally {
            setLoadingSaving(false);
        }
    };

    const handleCancel = async () => {
        const year = await getSelectedYear();
        const majors = await getSelectedMajors();
        if (year && majors) {
            router.replace("/selection");
        } else {
            Alert.alert("Configuration requise", "Veuillez configurer votre cursus pour continuer.");
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Mise à jour du catalogue...</Text>
            </View>
        );
    }

    const currentYearData = selectedYear ? structure.annee[selectedYear] : null;
    const semesters = currentYearData ? Object.keys(currentYearData) : [];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.welcomeText}>CalculNotes ISEN</Text>
                    <Text style={styles.title}>Configuration</Text>
                    <Text style={styles.description}>
                        {"Personnalisez votre application pour n'avoir qu'à consulter vos notes par la suite."}
                    </Text>
                </View>

                {/* Section Année */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.iconCircle}>
                            <Calendar size={18} color={Colors.primary} />
                        </View>
                        <Text style={styles.sectionTitle}>{"Année d'étude"}</Text>
                    </View>
                    <View style={styles.yearGrid}>
                        {years.map((year) => (
                            <YearSelectorButton
                                key={year}
                                year={year}
                                isSelected={selectedYear === year}
                                onSelect={handleYearSelect}
                                disabled={loadingSaving}
                            />
                        ))}
                    </View>
                </View>

                {/* Section Filières */}
                {selectedYear && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.iconCircle}>
                                <Layers size={18} color={Colors.primary} />
                            </View>
                            <Text style={styles.sectionTitle}>Vos filières</Text>
                        </View>
                        
                        {semesters.map((sem) => (
                            <MajorSelectorCard
                                key={sem}
                                semester={sem}
                                majors={Object.keys(currentYearData[sem])}
                                selectedMajor={selectedMajors[sem]}
                                onMajorSelect={handleMajorSelect}
                                disabled={loadingSaving}
                            />
                        ))}
                    </View>
                )}

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[
                            styles.saveButton,
                            (!selectedYear || semesters.some(s => !selectedMajors[s]) || loadingSaving) && styles.saveButtonDisabled
                        ]}
                        onPress={handleSave}
                        disabled={!selectedYear || semesters.some(s => !selectedMajors[s]) || loadingSaving}
                        activeOpacity={0.8}
                    >
                        {loadingSaving ? (
                            <View style={styles.saveLoadingRow}>
                                <ActivityIndicator size="small" color={Colors.surface} />
                                <Text style={styles.saveButtonText}>Synchronisation...</Text>
                            </View>
                        ) : (
                            <>
                                <Text style={styles.saveButtonText}>Confirmer mon cursus</Text>
                                <ArrowRight size={20} color={Colors.surface} />
                            </>
                        )}
                    </TouchableOpacity>
                    
                    {!loadingSaving && (
                        <TouchableOpacity 
                            style={styles.cancelButton}
                            onPress={handleCancel}
                        >
                            <Text style={styles.cancelButtonText}>Plus tard</Text>
                        </TouchableOpacity>
                    )}
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
        gap: 16,
    },
    loadingText: {
        fontSize: 15,
        color: Colors.text.secondary,
        fontWeight: '600',
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 24,
    },
    welcomeText: {
        fontSize: 13,
        color: Colors.primary,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    title: {
        fontSize: 34,
        fontWeight: '800',
        color: Colors.text.primary,
        letterSpacing: -1,
        marginTop: 4,
    },
    description: {
        fontSize: 15,
        color: Colors.text.secondary,
        fontWeight: '500',
        marginTop: 10,
        lineHeight: 22,
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 28,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 18,
        marginLeft: 4,
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: Colors.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: Colors.text.primary,
        letterSpacing: -0.2,
    },
    yearGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    footer: {
        paddingHorizontal: 24,
        marginTop: 16,
        gap: 12,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
        paddingVertical: 20,
        borderRadius: 20,
        gap: 12,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 6,
    },
    saveButtonDisabled: {
        backgroundColor: Colors.text.tertiary,
        shadowOpacity: 0,
        elevation: 0,
    },
    saveButtonText: {
        color: Colors.surface,
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: -0.2,
    },
    saveLoadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    cancelButton: {
        alignItems: 'center',
        paddingVertical: 14,
    },
    cancelButtonText: {
        color: Colors.text.tertiary,
        fontSize: 15,
        fontWeight: '700',
    },
});