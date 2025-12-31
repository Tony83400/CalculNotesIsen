import { getUrl } from "@/constants/api/agendaGoogle";
import { getId } from "@/constants/token";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import {
    StyleSheet,
    Text,
    View,
    ActivityIndicator,
    TouchableOpacity,
    Platform,
    Dimensions
} from "react-native";

export default function AgendaScreen() {
    const userId = getId();
    const [url, setUrl] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);

    // 1. Redirection si pas connecté
    if (!userId) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>Veuillez vous connecter pour voir votre agenda.</Text>
                <TouchableOpacity onPress={() => router.push("/")} style={styles.button}>
                    <Text style={styles.buttonText}>Se connecter</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const getAgendaUrl = async () => {
        try {
            setLoading(true);
            const data = await getUrl(userId);
            if (data?.lienAgenda) {
                setUrl(data.lienAgenda);
            }
        } catch (error) {
            console.log("Erreur de chargement", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getAgendaUrl();
    }, []);

    // 2. Affichage pendant le chargement
    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
                <Text style={{ marginTop: 10, color: '#666' }}>Chargement de l'agenda...</Text>
            </View>
        );
    }

    // 3. Affichage si aucune URL n'est trouvée
    if (!url) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.title}>Aucun agenda configuré</Text>
                <Text style={styles.subtitle}>Vous devez ajouter l'URL de votre Google Agenda pour qu'il s'affiche ici.</Text>
                
                <TouchableOpacity onPress={() => router.push("/chose")} style={styles.button}>
                    <Text style={styles.buttonText}>Configurer mon agenda</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.back()} style={styles.secondaryButton}>
                    <Text style={styles.secondaryButtonText}>Retour</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // 4. Affichage principal (L'agenda)
    return (
        <View style={styles.container}>
            {/* Header simple */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backLink}>← Retour</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mon Planning</Text>
                <View style={{ width: 50 }} /> {/* Cale pour centrer le titre */}
            </View>

            {/* Conteneur de l'Iframe */}
            <View style={styles.agendaContainer}>
                {Platform.OS === 'web' ? (
                    <iframe
                        src={url}
                        style={{
                            border: 'none',
                            width: '100%',
                            height: '100%',
                        }}
                        title="Agenda Google"
                    />
                ) : (
                    <Text style={{ padding: 20, textAlign: 'center' }}>
                        L'agenda est visible uniquement sur la version Web pour le moment.
                    </Text>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa', // Fond gris très clair
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    header: {
        height: 60,
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        // Ombre portée pour le style
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 3,
        zIndex: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    backLink: {
        fontSize: 16,
        color: '#4A90E2',
    },
    agendaContainer: {
        flex: 1, // Prend toute la place restante
        backgroundColor: '#fff',
        overflow: 'hidden', // Empêche le dépassement
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
        maxWidth: 400,
    },
    errorText: {
        fontSize: 18,
        color: 'red',
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#4A90E2',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
        marginBottom: 15,
        shadowColor: "#4A90E2",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        padding: 10,
    },
    secondaryButtonText: {
        color: '#666',
        fontSize: 16,
    }
});