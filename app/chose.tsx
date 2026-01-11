import { Text, View, TouchableOpacity, TextInput, StyleSheet } from "react-native";
import { router } from "expo-router";
import { getId } from "@/constants/token";
import { addUrl, getUrl } from "@/constants/api/agendaGoogle";
import { useEffect, useState } from "react"; // On importe useState d'ici !
import { Button } from "@react-navigation/elements";

export default function Chose() {
    const userId = getId();
    const [url, setUrl] = useState<string>("");
    const [inputUrl, setInputUrl] = useState<string>(""); // Variable temporaire pour l'input

    useEffect(() => {
    if (!userId) {
      router.push("/");
    }
  }, [userId]); // Se déclenche si userId change

  // Si on n'a pas de userId, on n'affiche rien en attendant la redirection
  if (!userId) {
     return null; 
  }

    // Chargement initial
    useEffect(() => {
        const getAgendaUrl = async () => {
            try {
                const data = await getUrl(userId);
                if (data?.lienAgenda) {
                    setUrl(data.lienAgenda);
                }
            } catch (error) {
                console.log("Erreur chargement", error);
            }
        };
        getAgendaUrl();
    }, []);

    // Sauvegarde
    const handleAddUrl = async () => {
        try {
            await addUrl(userId, inputUrl);
            setUrl(inputUrl); // On met à jour l'état "officiel" pour changer l'affichage
        } catch (error) {
            console.log("Erreur ajout", error);
        }
    };

    // --- CAS 1 : Pas d'URL enregistrée ---
    if (!url) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Que voulez-vous faire ?</Text>

                <TouchableOpacity onPress={() => router.push("/main")} style={styles.button}>
                    <Text style={styles.buttonText}>📝 Mes notes</Text>
                </TouchableOpacity>

                <Text style={styles.label}>Collez l'URL publique de votre agenda :</Text>

                <TextInput
                    style={styles.input}
                    placeholder="https://calendar.google.com/..."
                    placeholderTextColor="#aaa"
                    value={inputUrl}
                    onChangeText={setInputUrl}
                    autoCapitalize="none"
                />
                <Button onPress={handleAddUrl}>
                    Enregistrer l'URL
                </Button>
            </View>
        );
    }

    // --- CAS 2 : URL déjà là (Menu) ---
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Que voulez-vous faire ?</Text>

            <TouchableOpacity onPress={() => router.push("/main")} style={styles.button}>
                <Text style={styles.buttonText}>📝 Mes notes</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/agenda")} style={styles.button}>
                <Text style={styles.buttonText}>📅 Mon agenda</Text>
            </TouchableOpacity>

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, justifyContent: 'center' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 15,
        marginBottom: 20,
        borderRadius: 8
    },
    label: { marginBottom: 10, fontSize: 16 },
    title: { fontSize: 22, marginBottom: 30, textAlign: 'center' },
    link: { marginBottom: 20 },
    linkText: { color: 'blue' },
    button: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        alignItems: 'center'
    },
    buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});