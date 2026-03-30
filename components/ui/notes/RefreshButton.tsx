import React, { useState } from "react";
import { TouchableOpacity, ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { RefreshCw } from "lucide-react-native";

import { Colors } from "@/constants/Colors";
import { getAgendaIsen } from "@/services/agendaApi";
import { updateStructureConfig } from "@/services/configApi";
import { getNotes } from "@/services/isenApi";
import { clearAppCache } from "@/services/storage";

export default function RefreshButton() {
    const [refreshing, setRefreshing] = useState(false);
    
    const loadData = async () => {
        setRefreshing(true);
        try {
            await clearAppCache();
            await Promise.all([
                getAgendaIsen(), 
                getNotes(),
                updateStructureConfig(true)
            ]);
        } catch (error) {
            console.error("Erreur lors du refresh", error);
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