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
import { router } from "expo-router";
import { 
    Check,
    Calendar,
    Layers,
    Save
} from "lucide-react-native";

import { Colors } from "@/constants/Colors";
import { 
    getSelectedYear, 
    setSelectedYear, 
    getSelectedMajors, 
    setSelectedMajors,
    setSelectedMajorsUrls,
    saveStructureToCache
} from "@/services/storage";
import { fetchSemesterStructure } from "@/services/configApi";
import structureData from "@/structures_notes/structure.json";

export default function SelectionAnneeScreen() {
    const [loading, setLoading] = useState(true);
    const [loadingSaving, setLoadingSaving] = useState(false);
    const [selectedYear, setSelectedYearState] = useState<string | null>(null);
    const [selectedMajors, setSelectedMajorsState] = useState<Record<string, string>>({});

    const years = Object.keys(structureData.annee);

    useEffect(() => {
        const loadInitialData = async () => {
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
        const currentYearData = (structureData.annee as any)[year];
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
        setSelectedMajorsState(prev => ({
            ...prev,
            [semester]: major
        }));
    };

    const handleSave = async () => {
        if (!selectedYear) return;
        
        setLoadingSaving(true);
        try {
            const currentYearData = (structureData.annee as any)[selectedYear];
            const semesters = Object.keys(currentYearData);
            const urls: Record<string, string> = {};
            
            // Validate all semesters have a major selected
            const missing = semesters.find(s => !selectedMajors[s]);
            if (missing) {
                Alert.alert("Configuration incomplète", `Veuillez sélectionner une filière pour le semestre ${missing}.`);
                setLoadingSaving(false);
                return;
            }

            // Collect URLs and Fetch/Cache structures
            for (const s of semesters) {
                const major = selectedMajors[s];
                const url = currentYearData[s][major];
                urls[s] = url;
                
                // Fetch and Cache
                const structure = await fetchSemesterStructure(s, url);
                if (!structure) {
                    throw new Error(`Impossible de charger la structure pour ${s} (${major})`);
                }
            }

            // Save basic config
            await setSelectedYear(selectedYear);
            await setSelectedMajors(selectedMajors);
            await setSelectedMajorsUrls(urls);

            router.replace("/selection");
        } catch (error: any) {
            console.error("Save error:", error);
            Alert.alert("Erreur", error.message || "Impossible d'enregistrer la configuration.");
        } finally {
            setLoadingSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    const currentYearData = selectedYear ? (structureData.annee as any)[selectedYear] : null;
    const semesters = currentYearData ? Object.keys(currentYearData) : [];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.welcomeText}>Configuration</Text>
                    <Text style={styles.title}>Votre cursus</Text>
                    <Text style={styles.description}>Sélectionnez votre année et votre filière pour chaque semestre.</Text>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Calendar size={18} color={Colors.primary} />
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
                                        <Check size={12} color={Colors.surface} strokeWidth={3} />
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {selectedYear && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Layers size={18} color={Colors.primary} />
                            <Text style={styles.sectionTitle}>Filières par semestre</Text>
                        </View>
                        
                        {semesters.map((sem) => (
                            <View key={sem} style={styles.semesterCard}>
                                <View style={styles.semesterHeader}>
                                    <Text style={styles.semesterTitle}>{sem}</Text>
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
                                            <Text style={[
                                                styles.majorText,
                                                selectedMajors[sem] === major && styles.majorTextSelected
                                            ]}>
                                                {major}
                                            </Text>
                                            {selectedMajors[sem] === major && (
                                                <Check size={16} color={Colors.primary} strokeWidth={3} />
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
                            <ActivityIndicator color={Colors.surface} />
                        ) : (
                            <>
                                <Save size={20} color={Colors.surface} />
                                <Text style={styles.saveButtonText}>Enregistrer la configuration</Text>
                            </>
                        )}
                    </TouchableOpacity>
                    
                    {!loadingSaving && (
                        <TouchableOpacity 
                            style={styles.cancelButton}
                            onPress={() => router.back()}
                        >
                            <Text style={styles.cancelButtonText}>Annuler</Text>
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
        fontSize: 14,
        color: Colors.primary,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: Colors.text.primary,
        letterSpacing: -1,
        marginTop: 4,
    },
    description: {
        fontSize: 15,
        color: Colors.text.secondary,
        fontWeight: '500',
        marginTop: 8,
        lineHeight: 22,
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
        marginLeft: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text.primary,
    },
    yearGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    yearButton: {
        backgroundColor: Colors.surface,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        minWidth: 70,
        alignItems: 'center',
        position: 'relative',
    },
    yearButtonSelected: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary + '08',
    },
    yearButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text.secondary,
    },
    yearButtonTextSelected: {
        color: Colors.primary,
    },
    checkBadge: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: Colors.primary,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.surface,
    },
    semesterCard: {
        backgroundColor: Colors.surface,
        borderRadius: 24,
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
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
        paddingBottom: 12,
    },
    semesterTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.text.primary,
        letterSpacing: -0.5,
    },
    majorList: {
        gap: 10,
    },
    majorItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: Colors.background,
    },
    majorItemSelected: {
        backgroundColor: Colors.primary + '10',
    },
    majorText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text.secondary,
    },
    majorTextSelected: {
        color: Colors.text.primary,
        fontWeight: '700',
    },
    footer: {
        paddingHorizontal: 24,
        marginTop: 12,
        gap: 12,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
        paddingVertical: 18,
        borderRadius: 16,
        gap: 10,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 4,
    },
    saveButtonDisabled: {
        backgroundColor: Colors.text.tertiary,
        shadowOpacity: 0,
        elevation: 0,
    },
    saveButtonText: {
        color: Colors.surface,
        fontSize: 16,
        fontWeight: '800',
    },
    cancelButton: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    cancelButtonText: {
        color: Colors.text.secondary,
        fontSize: 15,
        fontWeight: '600',
    },
});