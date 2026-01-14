import { Text, View, TouchableOpacity, TextInput, StyleSheet } from "react-native";
import { router } from "expo-router";
import { getId } from "@/constants/token";
import { useEffect, useState } from "react"; // On importe useState d'ici !
import { getAgendaIsen } from "@/constants/api/agendaIsen";

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
  const loadData = async () =>{
    await getAgendaIsen();
  }

    // Chargement initial
    useEffect(() => {
        
    }, []);
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