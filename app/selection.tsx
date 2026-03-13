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
    User,
    Settings,
    LayoutDashboard,
    Heart
} from "lucide-react-native";

import RefreshButton from "@/components/ui/notes/RefreshButton";
import { Colors } from "@/constants/Colors";
import { getAgendaIsen } from "@/services/agendaApi";
import { getNotes } from "@/services/isenApi";
import { clearAllStorage, getId } from "@/services/storage";

export default function SelectionScreen() {
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const fetchId = async () => {
            const id = await getId();
            setUserId(id);
        };
        fetchId();
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
                {/* HEADER : Profil & Bienvenue */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <View style={styles.avatarContainer}>
                            <User size={24} color={Colors.primary} />
                        </View>
                        <TouchableOpacity style={styles.settingsBtn}>
                            <Settings size={20} color={Colors.text.secondary} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.welcomeText}>Bonjour,</Text>
                    <Text style={styles.title}>Tableau de bord</Text>
                </View>

                {/* CORPS : Fonctionnalités principales */}
                <View style={styles.mainContent}>
                    <Text style={styles.sectionTitle}>Services académiques</Text>
                    
                    {/* Carte NOTES */}
                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => router.push("/notes")}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.iconBox, { backgroundColor: Colors.primary + '10' }]}>
                            <GraduationCap size={28} color={Colors.primary} />
                        </View>
                        <View style={styles.cardTextContainer}>
                            <Text style={styles.cardTitle}>Mes Notes</Text>
                            <Text style={styles.cardDescription}>Moyennes, ECTS et simulations</Text>
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
                            <CalendarDays size={28} color={Colors.status.warning} />
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
                    <View style={styles.divider} />
                    
                    <View style={styles.actionRow}>
                        <RefreshButton />
                        <TouchableOpacity
                            onPress={() => { clearAllStorage(); router.replace("/") }}
                            style={styles.logoutBtn}
                        >
                            <LogOut size={18} color={Colors.status.error} />
                            <Text style={styles.logoutText}>Déconnexion</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.creditsContainer}>
                        <Text style={styles.versionText}>Version 2.0.0 — Refonte UI</Text>
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
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.primary + '20',
    },
    settingsBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    welcomeText: {
        fontSize: 16,
        color: Colors.text.secondary,
        fontWeight: '500',
        letterSpacing: -0.2,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: Colors.text.primary,
        letterSpacing: -1,
        marginTop: 4,
    },
    // Main Content
    mainContent: {
        paddingHorizontal: 20,
        gap: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginLeft: 4,
        marginBottom: 4,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: 16,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.border,
        // Ombre portée plus diffuse
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 12,
        elevation: 3,
    },
    iconBox: {
        width: 64,
        height: 64,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardTextContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text.primary,
        letterSpacing: -0.5,
    },
    cardDescription: {
        fontSize: 13,
        color: Colors.text.secondary,
        marginTop: 2,
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
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: Colors.divider,
        marginBottom: 24,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 24,
        marginBottom: 32,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    logoutText: {
        color: Colors.status.error,
        fontWeight: '700',
        fontSize: 14,
    },
    creditsContainer: {
        alignItems: 'center',
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    versionText: {
        color: Colors.text.tertiary,
        fontSize: 12,
        fontWeight: '600',
    },
    creditsText: {
        color: Colors.text.tertiary,
        fontSize: 11,
        fontWeight: '500',
    },
});