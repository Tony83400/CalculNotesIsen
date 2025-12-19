import { useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
  SafeAreaView
} from "react-native";
import { login } from "../constants/api/route";
import { setToken } from "@/constants/token";
import { router } from "expo-router";

export default function Index() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorText, setErrorText] = useState("");
  const onPressLogin = async () => {
    setErrorText("");
    try {
      const rep = await login({
        username: email,
        password: password
      });
      setToken(rep.token);
      router.push("/main");
    } catch (error) {
      console.log("Erreur", error);
      setErrorText("Nom d'utilisateur ou mot de passe invalide");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>

        {/* Titre */}
        <Text style={styles.title}>Connexion</Text>
        <Text style={styles.subtitle}>Veuillez vous identifier pour continuer</Text>

        {/* Champ Email */}
        <TextInput
          style={styles.input}
          placeholder="Nom d'utilisateur (prenom.nom)"
          placeholderTextColor="#aaa"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none" // Important pour les emails/user
          keyboardType="email-address"
        />

        {/* Champ Mot de passe */}
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor="#aaa"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true} // Masque le mot de passe
        />

        {/* Bouton */}
        <TouchableOpacity
          style={styles.button}
          onPress={onPressLogin}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Se connecter</Text>
        </TouchableOpacity>

        {/* Message d'erreur */}
        {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5", // Fond gris très clair
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 40,
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    borderColor: "#ddd",
    borderWidth: 1,
    // Ombre légère pour iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    // Ombre pour Android
    elevation: 2,
  },
  button: {
    width: "100%",
    height: 50,
    backgroundColor: "#007AFF", // Bleu standard iOS (ou ta couleur de marque)
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  errorText: {
    color: "#ff3b30",
    marginTop: 20,
    fontSize: 14,
    fontWeight: "600",
  },
});