import React, { useState } from "react";
import { TouchableOpacity, ActivityIndicator, StyleSheet, Text, View, Platform } from "react-native";
import { RefreshCw } from "lucide-react-native";

import { Colors } from "@/constants/Colors";
import { getAgendaIsen } from "@/services/agendaApi";
import { fetchSemesterStructure, updateStructureConfig } from "@/services/configApi";
import { getNotes } from "@/services/isenApi";
import { clearAppCache, getSelectedMajorsUrls, isTokenExpired } from "@/services/storage";
import { router } from "expo-router";
import { Alert } from "react-native";

const isWeb = Platform.OS === 'web';

export default function RefreshButton() {
    const [refreshing, setRefreshing] = useState(false);
    
    const loadData = async () => {
        setRefreshing(true);
        try {
            if (isWeb) {
                // Sur WEB : On actualise juste les données dynamiques (Notes/Agenda)
                await Promise.all([
                    getAgendaIsen(), 
                    getNotes()
                ]);
            } else {
                // Sur MOBILE : On vide tout et on re-télécharge tout
                const urls = await getSelectedMajorsUrls();
                await clearAppCache();
                
                const tasks: Promise<any>[] = [
                    getAgendaIsen(), 
                    getNotes(),
                    updateStructureConfig(true)
                ];

                if (urls) {
                    Object.entries(urls).forEach(([sem, url]) => {
                        tasks.push(fetchSemesterStructure(sem, url, true));
                    });
                }
                await Promise.all(tasks);
            }
        } catch (error: any) {
            console.error("Erreur lors du refresh", error);
            if (error.message === "Session expirée") {
                router.replace("/");
            }
        } finally {
            setRefreshing(false);
        }
    };

    return (
        <TouchableOpacity
            onPress={loadData}
            style={[styles.button, refreshing && styles.buttonDisabled]}
            disabled={refreshing}
            activeOpacity={0.7}
        >
            {refreshing ? (
                <ActivityIndicator color={Colors.primary} size="small" />
            ) : (
                <RefreshCw size={18} color={Colors.primary} />
            )}
            <Text style={styles.buttonText}>
                {refreshing ? "Mise à jour..." : "Actualiser les données"}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface, 
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: 10,
        // Subtile shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 2,
    },
    buttonDisabled: {
        opacity: 0.8,
        backgroundColor: Colors.background,
    },
    buttonText: {
        color: Colors.primary,
        fontWeight: '700',
        fontSize: 14,
        letterSpacing: -0.3,
    },
});