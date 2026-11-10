import React, { useState } from "react";
import { TouchableOpacity, ActivityIndicator, StyleSheet, Text } from "react-native";
import { RefreshCw } from "lucide-react-native";
import { Colors } from "@/constants/Colors";
import { useAppData } from "@/providers/AppData";

export default function RefreshButton() {
  const [refreshing, setRefreshing] = useState(false);
  const app = useAppData();

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await app.refresh();
    } catch (e) {
      console.error("Erreur lors du refresh", e);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleRefresh}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.divider,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  buttonDisabled: {
    opacity: 0.8,
    backgroundColor: Colors.background,
  },
  buttonText: {
    color: Colors.primary,
    fontWeight: "600",
    fontSize: 13,
    letterSpacing: -0.2,
  },
});
