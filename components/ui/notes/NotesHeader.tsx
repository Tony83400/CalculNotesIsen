import { Colors } from "@/constants/Colors";
import { getAgendaIsen } from "@/services/agendaApi";
import { updateStructureConfig } from "@/services/configApi";
import { getNotes } from "@/services/isenApi";
import { clearAppCache } from "@/services/storage";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from "react-native";

interface NotesHeaderProps {
    filiere: string;
    lastUpdate: Date;
    onBack: () => void;
    onHome: () => void;
}

export default function NotesHeader({ filiere, lastUpdate, onBack, onHome }: NotesHeaderProps) {
    const [refreshing, setRefreshing] = useState(false);

    const loadData = async () => {
        setRefreshing(true);
        try {
            await clearAppCache();
            await Promise.all([getAgendaIsen(), getNotes(), updateStructureConfig()]);
        } catch (error) {
            console.error("Erreur lors du refresh", error);
        } finally {
            setRefreshing(false);
        }
    };

    return (
        <SafeAreaView style={styles.headerContainer}>
            <View style={styles.header}>
                {/* Left: Back Button */}
                <View style={styles.headerSide}>
                    <TouchableOpacity onPress={onBack} style={styles.button}>
                        <Ionicons name="arrow-back" size={16} color={Colors.text.secondary} />
                        <Text style={styles.buttonText}>Retour</Text>
                    </TouchableOpacity>
                </View>

                {/* Center: Title */}
                <View style={styles.headerCenter}>
                    <Text style={styles.title} numberOfLines={1}>
                        {filiere}
                    </Text>
                    <Text style={styles.subtitle}>
                        Dernière MàJ: {lastUpdate.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>

                {/* Right: Buttons */}
                <View style={[styles.headerSide, { justifyContent: 'flex-end', gap: 8 }]}>
                    <TouchableOpacity onPress={loadData} style={styles.iconButton} disabled={refreshing}>
                        {refreshing ? (
                            <ActivityIndicator color={Colors.primary} size="small" />
                        ) : (
                            <Ionicons name="refresh" size={20} color={Colors.primary} />
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onHome} style={styles.button}>
                        <Text style={styles.buttonText}>Accueil</Text>
                        <Ionicons name="home-outline" size={16} color={Colors.text.secondary} />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        backgroundColor: Colors.surface,
        paddingBottom: 8,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderColor: Colors.border,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 50,
    },
    headerSide: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerCenter: {
        flex: 2,
        alignItems: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    subtitle: {
        fontSize: 10,
        color: Colors.text.secondary,
        marginTop: 2,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        gap: 6,
    },
    iconButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.background,
        padding: 6,
        borderRadius: 8,
        width: 32,
        height: 32,
    },
    buttonText: {
        color: Colors.text.secondary,
        fontWeight: '600',
        fontSize: 12,
    },
});
