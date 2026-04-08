import React, { useEffect, useState } from "react";
import {
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ScrollView
} from "react-native";
import { router } from "expo-router";
import { 
    GraduationCap, 
    CalendarDays, 
    ChevronRight, 
    LogOut, 
    Heart,
    Settings,
    ArrowRight
} from "lucide-react-native";

import RefreshButton from "@/components/ui/notes/RefreshButton";
import { Colors } from "@/constants/Colors";
import { getAgendaIsen } from "@/services/agendaApi";
import { getNotes } from "@/services/isenApi";
import { 
    clearAllStorage, 
    getId, 
    getSelectedMajors, 
    getSelectedYear,
    setSelectedSemester 
} from "@/services/storage";
import { updateStructureConfig } from "@/services/configApi";

export default function SelectionScreen() {
    const [userId, setUserId] = useState<string | null>(null);
    const [selectedYear, setSelectedYear] = useState<string | null>(null);

    useEffect(() => {
        const fetchConfig = async () => {
            const id = await getId();
            const year = await getSelectedYear();
            
            setUserId(id);
            setSelectedYear(year);
        };
        fetchConfig();
        updateStructureConfig();
    }, []);

    useEffect(() => {
        if (!userId) return;
        getAgendaIsen();
        getNotes();
    }, [userId]);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* HEADER : Bienvenue */}
                <View style={styles.header}>
                    <View style={styles.headerTopRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.welcomeText}>Bonjour,</Text>
                            <Text style={styles.title}>Tableau de bord</Text>
                            {selectedYear && <Text style={styles.yearText}>{selectedYear}</Text>}
                        </View>
                        <TouchableOpacity 
                            style={styles.settingsBtn}
                            onPress={() => router.push("/selectionAnnee")}
                            activeOpacity={0.7}
                        >
                            <View style={styles.settingsIconCircle}>
                                <Settings size={18} color={Colors.primary} />
                            </View>
                            <Text style={styles.settingsBtnText}>Configurer mon cursus</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* CORPS : Fonctionnalités principales */}
                <View style={styles.mainContent}>
                    <Text style={styles.sectionTitle}>Services académiques</Text>
                    
                    {/* Carte NOTES */}
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => router.push("/selectionSemestre")}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.iconBox, { backgroundColor: Colors.primary + '10' }]}>
                            <GraduationCap size={32} color={Colors.primary} />
                        </View>
                        <View style={styles.cardTextContainer}>
                            <Text style={styles.cardTitle}>Consulter mes notes</Text>
                            <Text style={styles.cardDescription}>Choix du semestre, ECTS et moyennes</Text>
                        </View>
                        <View style={styles.arrowContainer}>
                            <ChevronRight size={20} color={Colors.text.tertiary} />
                        </View>
                    </TouchableOpacity>

                    {/* Carte AGENDA */}
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => router.push("/agenda")}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.iconBox, { backgroundColor: Colors.status.warning + '10' }]}>
                            <CalendarDays size={32} color={Colors.status.warning} />
                        </View>
                        <View style={styles.cardTextContainer}>
                            <Text style={styles.cardTitle}>Mon Agenda</Text>
                            <Text style={styles.cardDescription}>Emploi du temps de la semaine</Text>
                        </View>
                        <View style={styles.arrowContainer}>
                            <ChevronRight size={20} color={Colors.text.tertiary} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* FOOTER : Actions & Infos */}
                <View style={styles.footer}>
                    <View style={styles.actionRow}>
                        <RefreshButton />
                        <TouchableOpacity
                            onPress={async () => { await clearAllStorage(); router.replace("/") }}
                            style={styles.logoutBtn}
                        >
                            <LogOut size={18} color={Colors.status.error} />
                            <Text style={styles.logoutText}>Déconnexion</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.creditsContainer}>
                        <Text style={styles.versionText}>CalculNotesISEN v2.5</Text>
                        <View style={styles.authorRow}>
                            <Text style={styles.creditsText}>Fait avec </Text>
                            <Heart size={10} color={Colors.status.error} fill={Colors.status.error} />
                            <Text style={styles.creditsText}> par Anthony Coulais</Text>
                        </View>
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
    scrollContent: {
        flexGrow: 1,
    },
    // Header
    header: {
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 32,
    },
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    settingsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 1,
    },
    settingsIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: Colors.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingsBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.text.primary,
        letterSpacing: -0.2,
    },
    welcomeText: {
        fontSize: 16,
        color: Colors.text.secondary,
        fontWeight: '600',
        letterSpacing: -0.2,
    },
    title: {
        fontSize: 34,
        fontWeight: '800',
        color: Colors.text.primary,
        letterSpacing: -1,
        marginTop: 4,
    },
    yearText: {
        fontSize: 15,
        color: Colors.primary,
        fontWeight: '700',
        marginTop: 4,
        backgroundColor: Colors.primary + '10',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 10,
    },
    // Main Content
    mainContent: {
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: Colors.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginLeft: 8,
        marginBottom: 16,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: 16,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 2,
        marginBottom: 12,
    },
    iconBox: {
        width: 60,
        height: 60,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardTextContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: Colors.text.primary,
        letterSpacing: -0.5,
        marginBottom: 2,
    },
    cardDescription: {
        fontSize: 13,
        color: Colors.text.secondary,
        fontWeight: '500',
    },
    arrowContainer: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Footer
    footer: {
        marginTop: 'auto',
        padding: 32,
        alignItems: 'center',
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 24,
        marginBottom: 40,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.status.error + '10',
        borderRadius: 14,
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    logoutText: {
        color: Colors.status.error,
        fontWeight: '700',
        fontSize: 14,
    },
    creditsContainer: {
        alignItems: 'center',
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: Colors.divider,
        width: '100%',
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    versionText: {
        color: Colors.text.primary,
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: -0.2,
    },
    creditsText: {
        color: Colors.text.secondary,
        fontSize: 12,
        fontWeight: '500',
    },
});