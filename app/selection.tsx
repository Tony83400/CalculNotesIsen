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
    Heart
} from "lucide-react-native";

import RefreshButton from "@/components/ui/notes/RefreshButton";
import { Colors } from "@/constants/Colors";
import { getAgendaIsen } from "@/services/agendaApi";
import { getNotes } from "@/services/isenApi";
import { clearAllStorage, getId } from "@/services/storage";
import { updateStructureConfig } from "@/services/configApi";

export default function SelectionScreen() {
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const fetchId = async () => {
            const id = await getId();
            setUserId(id);
        };
        fetchId();
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
                            <GraduationCap size={32} color={Colors.primary} />
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
                            onPress={() => { clearAllStorage(); router.replace("/") }}
                            style={styles.logoutBtn}
                        >
                            <LogOut size={18} color={Colors.status.error} />
                            <Text style={styles.logoutText}>Déconnexion</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.creditsContainer}>
                        <Text style={styles.versionText}>CalculNotesISEN v2.0</Text>
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
    // Main Content
    mainContent: {
        paddingHorizontal: 16,
        gap: 16,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: Colors.text.tertiary,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginLeft: 8,
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
        // Ombre portée très douce
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
        elevation: 3,
    },
    iconBox: {
        width: 68,
        height: 68,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardTextContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 19,
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
        width: 36,
        height: 36,
        borderRadius: 12,
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