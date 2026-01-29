import { getId, getPasswordStorage, setId, setPasswordStorage, setToken } from "@/services/storage";
import { router } from "expo-router";
import { use, useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { login } from "../services/isenApi";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { Analytics } from "@vercel/analytics/react"

export default function Index() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorText, setErrorText] = useState("");
  const [keepLogin, setKeepLogin] = useState(false);
  useEffect(() => {
    const fetchUser = async () => {
      const Fetchemail = await getId();
      if (Fetchemail) {
        setEmail(Fetchemail);
      }
      const Fetchpassword = await getPasswordStorage();
      if (Fetchpassword) {
        setPassword(Fetchpassword);
      }
      if (Fetchemail && Fetchpassword) {
        await onPressLogin(Fetchemail, Fetchpassword);
      }
    }
    fetchUser();

  }, []);
  const onPressLogin = async (emailLogin: string, passwordLogin: string) => {
    setErrorText("");
    try {
      const rep = await login({
        username: emailLogin,
        password: passwordLogin
      });
      await setToken(rep.token);
      await setId(email);
      if (keepLogin) {
        await setPasswordStorage(password);
      }
      router.push("/selection");
    } catch (error) {
      console.log("Erreur", error);
      setErrorText((error as Error).message);
    }
  };
  const onPressContinueWithoutLogin = async () => {
    await setId("");
    router.push("/notes");
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
          onPress={()=>onPressLogin(email,password)}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Se connecter</Text>
        </TouchableOpacity>
        {/* Rester connecte */}
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setKeepLogin(!keepLogin)}
          activeOpacity={0.6}
        >
          <Ionicons name={keepLogin ? "checkbox" : "square-outline"} size={24} color={Colors.primary} />
          <Text style={styles.checkboxLabel}>Rester connecté</Text>
        </TouchableOpacity>

        {/* Message d'erreur */}
        {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
        {errorText ? <TouchableOpacity
          style={styles.button}
          onPress={onPressContinueWithoutLogin}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Continuer sans se connecter</Text>
        </TouchableOpacity> : null}

          <Analytics/>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background, // Uniformise le fond avec le reste de l'app
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
    color: Colors.text.primary, // Noir standardisé
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary, // Gris standardisé
    marginBottom: 40,
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    borderColor: Colors.border,
    borderWidth: 1,
    color: Colors.text.primary,
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
    backgroundColor: Colors.primary, // Bleu standard iOS (ou ta couleur de marque)
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
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    alignSelf: "flex-start",
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
    color: Colors.text.primary,
  },
  errorText: {
    color: Colors.status.error, // Rouge harmonisé
    marginTop: 20,
    fontSize: 14,
    fontWeight: "600",
  },
});