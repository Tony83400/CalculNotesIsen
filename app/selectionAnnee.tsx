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
    Alert,
    Dimensions
} from "react-native";
import { router } from "expo-router";
import { 
    Check,
    Calendar,
    Layers,
    Save,
    ChevronRight,
    ArrowRight
} from "lucide-react-native";

import { Colors } from "@/constants/Colors";
import { 
    getSelectedYear, 
    setSelectedYear, 
    getSelectedMajors, 
    setSelectedMajors,
    setSelectedMajorsUrls,
    setSelectedSemester
} from "@/services/storage";
import { updateStructureConfig, fetchSemesterStructure } from "@/services/configApi";
import bundledStructure from "@/structures_notes/structure.json";

const { width } = Dimensions.get('window');

export default function SelectionAnneeScreen() {
    const [loading, setLoading] = useState(true);
    const [loadingSaving, setLoadingSaving] = useState(false);
    const [structure, setStructure] = useState<any>(bundledStructure);
    const [selectedYear, setSelectedYearState] = useState<string | null>(null);
    const [selectedMajors, setSelectedMajorsState] = useState<Record<string, string>>({});

    const years = Object.keys(structure.annee);

    useEffect(() => {
        const loadInitialData = async () => {
            // Tente de récupérer la version la plus fraîche du catalogue
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
        
        // Reset majors but keep those that match in the new year
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
        
        // "Sélectionner une seule fois" : 
        // Si la même filière existe dans d'autres semestres de l'année choisie, on l'applique aussi
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
            
            // Validation
            const missing = semesters.find(s => !selectedMajors[s]);
            if (missing) {
                Alert.alert("Configuration incomplète", `Veuillez sélectionner une filière pour le semestre ${missing}.`);
                setLoadingSaving(false);
                return;
            }

            // Téléchargement et mise en cache de toutes les structures nécessaires
            for (const s of semesters) {
                const major = selectedMajors[s];
                const url = currentYearData[s][major];
                urls[s] = url;
                
                // Fetch et Cache hybride (via configApi)
                const data = await fetchSemesterStructure(s, url);
                if (!data) {
                    throw new Error(`Erreur lors du téléchargement de la structure pour ${s} (${major})`);
                }
            }

            // Sauvegarde de la configuration globale
            await setSelectedYear(selectedYear);
            await setSelectedMajors(selectedMajors);
            await setSelectedMajorsUrls(urls);
            
            // Auto-sélection du semestre par défaut basé sur la date
            const month = new Date().getMonth(); // 0-11
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
                        Personnalisez votre application pour n'avoir qu'à consulter vos notes par la suite.
                    </Text>
                </View>

                {/* Section Année */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.iconCircle}>
                            <Calendar size={18} color={Colors.primary} />
                        </View>
                        <Text style={styles.sectionTitle}>Année d'étude</Text>
                    </View>
                    <View style={styles.yearGrid}>
                        {years.map((year) => (
                            <TouchableOpacity
                                key={year}
                                style={[
                                    styles.yearButton,
                                    selectedYear === year && styles.yearButtonSelected
                                ]}
                                onPress={() => handleYearSelect(year)}
                                activeOpacity={0.7}
                                disabled={loadingSaving}
                            >
                                <Text style={[
                                    styles.yearButtonText,
                                    selectedYear === year && styles.yearButtonTextSelected
                                ]}>
                                    {year}
                                </Text>
                                {selectedYear === year && (
                                    <View style={styles.checkBadge}>
                                        <Check size={10} color={Colors.surface} strokeWidth={4} />
                                    </View>
                                )}
                            </TouchableOpacity>
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
                            <View key={sem} style={styles.semesterCard}>
                                <View style={styles.semesterHeader}>
                                    <View style={styles.semesterBadge}>
                                        <Text style={styles.semesterBadgeText}>{sem}</Text>
                                    </View>
                                    <Text style={styles.semesterSubtitle}>
                                        {selectedMajors[sem] ? 'Filière sélectionnée' : 'Sélectionnez votre filière'}
                                    </Text>
                                </View>
                                
                                <View style={styles.majorList}>
                                    {Object.keys(currentYearData[sem]).map((major: string) => (
                                        <TouchableOpacity
                                            key={major}
                                            style={[
                                                styles.majorItem,
                                                selectedMajors[sem] === major && styles.majorItemSelected
                                            ]}
                                            onPress={() => handleMajorSelect(sem, major)}
                                            activeOpacity={0.7}
                                            disabled={loadingSaving}
                                        >
                                            <View style={styles.majorContent}>
                                                <Text style={[
                                                    styles.majorText,
                                                    selectedMajors[sem] === major && styles.majorTextSelected
                                                ]}>
                                                    {major}
                                                </Text>
                                            </View>
                                            {selectedMajors[sem] === major ? (
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
    yearButton: {
        backgroundColor: Colors.surface,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border,
        minWidth: width * 0.22,
        alignItems: 'center',
        position: 'relative',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 1,
    },
    yearButtonSelected: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary,
        shadowColor: Colors.primary,
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    yearButtonText: {
        fontSize: 17,
        fontWeight: '700',
        color: Colors.text.secondary,
    },
    yearButtonTextSelected: {
        color: Colors.surface,
    },
    checkBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: Colors.status.success,
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.surface,
    },
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