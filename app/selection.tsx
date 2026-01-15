import { Colors } from "@/constants/Colors"; // Ton fichier de couleurs
import { getAgendaIsen } from "@/services/agendaApi";
import { getNotes } from "@/services/isenApi";
import { clearAgendaFromStorage, clearNotesFromStorage, getId } from "@/services/storage";
import { Ionicons } from '@expo/vector-icons';
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

export default function Selection() {
    const userId = getId();
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (!userId) {
            router.replace("/"); // Utilise replace pour qu'on ne puisse pas revenir en arrière
        }
    }, [userId]);

    const loadData = async () => {
        setRefreshing(true);
        // On vide d'abord pour forcer la mise à jour propre
        clearAgendaFromStorage();
        clearNotesFromStorage();
        
        // On recharge
        await Promise.all([getAgendaIsen(), getNotes()]);
        setRefreshing(false);
    };

    // Chargement initial silencieux
    useEffect(() => {
        getAgendaIsen();
        getNotes();
    }, []);

    if (!userId) return null;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* HEADER : Bienvenue */}
            <View style={styles.header}>
                <Text style={styles.subtitle}>Bienvenue sur ton espace</Text>
                <Text style={styles.title}>Tableau de bord</Text>
            </View>

            {/* CORPS : Les fonctionnalités principales */}
            <View style={styles.mainContent}>
                
                {/* Carte NOTES */}
                <TouchableOpacity 
                    style={styles.card} 
                    onPress={() => router.push("/notes")}
                    activeOpacity={0.7}
                >
                    <View style={[styles.iconContainer, { backgroundColor: '#E0F2FE' }]}>
                        <Ionicons name="school" size={32} color={Colors.primary} />
                    </View>
                    <View style={styles.cardTextContainer}>
                        <Text style={styles.cardTitle}>Mes Notes</Text>
                        <Text style={styles.cardDescription}>Consulter mes moyennes et résultats</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#C7C7CC" />
                </TouchableOpacity>

                {/* Carte AGENDA */}
                <TouchableOpacity 
                    style={styles.card} 
                    onPress={() => router.push("/agenda")}
                    activeOpacity={0.7}
                >
                    <View style={[styles.iconContainer, { backgroundColor: '#FEF3C7' }]}>
                        <Ionicons name="calendar" size={32} color={Colors.status.warning} />
                    </View>
                    <View style={styles.cardTextContainer}>
                        <Text style={styles.cardTitle}>Mon Agenda</Text>
                        <Text style={styles.cardDescription}>Voir mon emploi du temps de la semaine</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#C7C7CC" />
                </TouchableOpacity>

            </View>

            {/* FOOTER : Actions secondaires */}
            <View style={styles.footer}>
                
                {/* Bouton Actualiser */}
                <TouchableOpacity 
                    onPress={loadData} 
                    style={styles.secondaryButton}
                    disabled={refreshing}
                >
                    {refreshing ? (
                        <ActivityIndicator color={Colors.primary} size="small" />
                    ) : (
                        <Ionicons name="refresh" size={20} color={Colors.primary} />
                    )}
                    <Text style={styles.secondaryButtonText}>
                        {refreshing ? "Actualisation..." : "Actualiser les données"}
                    </Text>
                </TouchableOpacity>

                {/* Bouton Déconnexion */}
                <TouchableOpacity 
                    onPress={() => router.replace("/")} 
                    style={styles.logoutButton}
                >
                    <Ionicons name="log-out-outline" size={20} color={Colors.status.error} />
                    <Text style={styles.logoutText}>Se déconnecter</Text>
                </TouchableOpacity>
                
                <Text style={styles.versionText}>v1.0.0 - ISEN Engineering</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    // Header Styles
    header: {
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 20,
    },
    subtitle: {
        fontSize: 16,
        color: Colors.text.secondary,
        fontWeight: '500',
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: Colors.text.primary,
        marginTop: 4,
    },
    
    // Main Content (Cards)
    mainContent: {
        paddingHorizontal: 20,
        gap: 20, // Espace entre les cartes
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: 20,
        borderRadius: 20,
        // Ombres douces
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 4,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardTextContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text.primary,
        marginBottom: 4,
    },
    cardDescription: {
        fontSize: 13,
        color: Colors.text.tertiary,
    },

    // Footer Styles
    footer: {
        marginTop: 'auto', // Pousse le footer tout en bas
        padding: 30,
        alignItems: 'center',
        gap: 15,
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface, // Fond blanc
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: 8,
    },
    secondaryButtonText: {
        color: Colors.primary,
        fontWeight: '600',
        fontSize: 14,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        gap: 6,
    },
    logoutText: {
        color: Colors.status.error,
        fontWeight: '600',
        fontSize: 14,
    },
    versionText: {
        color: '#CBD5E1',
        fontSize: 11,
        marginTop: 10,
    },
});