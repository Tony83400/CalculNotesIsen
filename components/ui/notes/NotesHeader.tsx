import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";

interface NotesHeaderProps {
    filiere: string;
    lastUpdate: Date;
    onBack: () => void;
    onHome: () => void;
}

export default function NotesHeader({ filiere, lastUpdate, onBack, onHome }: NotesHeaderProps) {
    return (
        <View style={styles.headerContainer}>
            <View style={styles.header}>
                {/* Left: Back Button */}
                <View style={styles.headerSide}>
                    <TouchableOpacity onPress={onBack} style={styles.button}>
                        <Ionicons name="arrow-back" size={18} color={Colors.text.secondary} />
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

                {/* Right: Home Button */}
                <View style={styles.headerSide}>
                    <TouchableOpacity onPress={onHome} style={[styles.button, { justifyContent: 'flex-end' }]}>
                        <Text style={styles.buttonText}>Accueil</Text>
                        <Ionicons name="home-outline" size={16} color={Colors.text.secondary} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        backgroundColor: Colors.surface,
        paddingTop: 50, // Adjust for status bar height
        paddingBottom: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderColor: Colors.border,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerSide: {
        flex: 1,
        flexDirection: 'row',
    },
    headerCenter: {
        flex: 2,
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text.primary,
    },
    subtitle: {
        fontSize: 11,
        color: Colors.text.secondary,
        marginTop: 2,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        gap: 6,
    },
    buttonText: {
        color: Colors.text.secondary,
        fontWeight: '600',
        fontSize: 13,
    },
});
