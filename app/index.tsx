import { getId, getPasswordStorage, setId, setPasswordStorage, setToken } from "@/services/storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { login } from "../services/isenApi";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { Analytics } from "@vercel/analytics/react";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

export default function Index() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorText, setErrorText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [keepLogin, setKeepLogin] = useState(false);

  // Animation value
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  useEffect(() => {
    const fetchUser = async () => {
      const Fetchemail = await getId();
      if (Fetchemail) {
        setEmail(Fetchemail);
        setKeepLogin(true); // If there's a stored email, we assume they wanted to stay logged in
      }
      const Fetchpassword = await getPasswordStorage();
      if (Fetchpassword) {
        setPassword(Fetchpassword);
      }
      if (Fetchemail && Fetchpassword) {
        await onPressLogin(Fetchemail, Fetchpassword);
      } else {
        setIsLoading(false);
        opacity.value = withTiming(1, { duration: 500 }); // Fade in animation
      }
    };
    fetchUser();
  }, []);

  const onPressLogin = async (emailLogin: string, passwordLogin: string) => {
    setErrorText("");
    setIsLoginLoading(true);
    try {
      const rep = await login({
        username: emailLogin,
        password: passwordLogin,
      });
      await setToken(rep.token);
      await setId(email);
      if (keepLogin) {
        await setPasswordStorage(password);
      } else {
        await setPasswordStorage(""); // Clear password if not kept
      }
      router.push("/selection");
    } catch (error) {
      console.log("Erreur", error);
      setErrorText((error as Error).message);
    } finally {
      setIsLoginLoading(false);
      setIsLoading(false); // Ensure main loader is off
      opacity.value = withTiming(1, { duration: 500 }); // Fade in on error too
    }
  };

  const onPressContinueWithoutLogin = async () => {
    await setId("");
    router.push("/notes");
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <Animated.View style={[styles.contentContainer, animatedStyle]}>
          <View style={styles.header}>
            <Ionicons name="school-outline" size={48} color={Colors.primary} />
            <Text style={styles.title}>CalculNotes</Text>
            <Text style={styles.subtitle}>Connectez-vous à votre compte ISEN.</Text>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={22} color={Colors.text.tertiary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nom d'utilisateur (prenom.nom)"
              placeholderTextColor={Colors.text.tertiary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={22} color={Colors.text.tertiary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              placeholderTextColor={Colors.text.tertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={true}
              returnKeyType="done"
            />
          </View>

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setKeepLogin(!keepLogin)}
            activeOpacity={0.7}
          >
            <Ionicons name={keepLogin ? "checkbox" : "square-outline"} size={24} color={Colors.primary} />
            <Text style={styles.checkboxLabel}>Rester connecté</Text>
          </TouchableOpacity>

          {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

          <TouchableOpacity
            style={styles.button}
            onPress={() => onPressLogin(email, password)}
            activeOpacity={0.8}
            disabled={isLoginLoading}
          >
            {isLoginLoading ? (
              <ActivityIndicator color={Colors.text.inverse} />
            ) : (
              <>
                <Text style={styles.buttonText}>Se connecter</Text>
                <Ionicons name="arrow-forward" size={20} color={Colors.text.inverse} style={{ marginLeft: 8 }}/>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onPressContinueWithoutLogin}
            activeOpacity={0.7}
            style={styles.guestButton}
          >
            <Text style={styles.guestButtonText}>Continuer sans se connecter</Text>
          </TouchableOpacity>

          <Analytics />
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
  },
  contentContainer: {
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 34,
    fontWeight: "bold",
    color: Colors.text.primary,
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 16,
    // Ombre "flottante"
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  inputIcon: {
    paddingLeft: 15,
  },
  input: {
    flex: 1,
    height: 55,
    paddingHorizontal: 10,
    fontSize: 16,
    color: Colors.text.primary,
  },
  button: {
    flexDirection: 'row',
    height: 55,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    // Ombre "flottante"
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: Colors.text.inverse,
    fontSize: 18,
    fontWeight: "bold",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginBottom: 20,
    paddingVertical: 5,
  },
  checkboxLabel: {
    marginLeft: 10,
    fontSize: 16,
    color: Colors.text.secondary,
  },
  errorText: {
    color: Colors.status.error,
    marginBottom: 15,
    fontSize: 14,
    fontWeight: "600",
    textAlign: 'center',
  },
  guestButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  guestButtonText: {
    color: Colors.text.secondary,
    fontSize: 15,
    fontWeight: '500',
  }
});