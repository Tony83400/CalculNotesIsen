import { Colors } from "@/constants/Colors";
import { getAgendaIsen } from "@/services/agendaApi";
import { getNotes } from "@/services/isenApi";
import { clearAppCache } from "@/services/storage";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { TouchableOpacity, ActivityIndicator,StyleSheet ,Text} from "react-native";

export default function RefreshButton() {
        const [refreshing, setRefreshing] = useState(false);
    
    const loadData = async () => {
            // On empêche de rafraîchir si on n'a pas d'user (sécurité)
    
            setRefreshing(true);
            try {
                await clearAppCache();
    
                // Promise.all est top ici pour paralléliser les deux requêtes
                await Promise.all([getAgendaIsen(), getNotes()]);
            } catch (error) {
                console.error("Erreur lors du refresh", error);
            } finally {
                setRefreshing(false);
            }
        };
    return(
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
    )
}


const styles = StyleSheet.create({
     secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface, 
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
});