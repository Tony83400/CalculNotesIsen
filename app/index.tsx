import React, { useEffect, useState } from "react";
import {
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
} from "react-native";
import { router } from "expo-router";
import { 
    Lock, 
    User, 
    ChevronRight, 
    CheckCircle2, 
    Circle, 
    AlertCircle,
    GraduationCap
} from "lucide-react-native";
import { Analytics } from "@vercel/analytics/react";

import { getId, getPasswordStorage, setId, setPasswordStorage, setToken } from "@/services/storage";
import { login } from "../services/isenApi";
import { Colors } from "@/constants/Colors";

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorText, setErrorText] = useState("");
    const [keepLogin, setKeepLogin] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            const Fetchemail = await getId();
            if (Fetchemail) setEmail(Fetchemail);
            
            const Fetchpassword = await getPasswordStorage();
            if (Fetchpassword) {
                setPassword(Fetchpassword);
                if (Fetchemail) {
                    onPressLogin(Fetchemail, Fetchpassword);
                }
            }
        };
        fetchUser();
    }, []);

    const onPressLogin = async (emailLogin: string, passwordLogin: string) => {
        if (!emailLogin || !passwordLogin) {
            setErrorText("Veuillez remplir tous les champs");
            return;
        }

        setLoading(true);
        setErrorText("");
        
        try {
            const rep = await login({
                username: emailLogin,
                password: passwordLogin
            });
            await setToken(rep.token);
            await setId(emailLogin);
            if (keepLogin) {
                await setPasswordStorage(passwordLogin);
            }
            router.replace("/selection");
        } catch (error) {
            setErrorText((error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const onPressContinueWithoutLogin = async () => {
        await setId("");
        router.push("/notes");
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <View style={styles.contentContainer}>
                    {/* LOGO SECTION */}
                    <View style={styles.logoContainer}>
                        <View style={styles.logoIcon}>
                            <GraduationCap size={40} color={Colors.primary} />
                        </View>
                        <Text style={styles.logoTitle}>CalculNotes<Text style={{color: Colors.primary}}>ISEN</Text></Text>
                    </View>

                    {/* TITLE SECTION */}
                    <View style={styles.headerText}>
                        <Text style={styles.title}>Connexion</Text>
                        <Text style={styles.subtitle}>Identifiez-vous avec vos identifiants ISEN</Text>
                    </View>

                    {/* INPUTS SECTION */}
                    <View style={styles.form}>
                        <View style={styles.inputWrapper}>
                            <User size={20} color={Colors.text.tertiary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="prenom.nom"
                                placeholderTextColor={Colors.text.tertiary}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={styles.inputWrapper}>
                            <Lock size={20} color={Colors.text.tertiary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Mot de passe"
                                placeholderTextColor={Colors.text.tertiary}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={true}
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.keepLoginContainer}
                            onPress={() => setKeepLogin(!keepLogin)}
                            activeOpacity={0.7}
                        >
                            {keepLogin ? (
                                <CheckCircle2 size={20} color={Colors.primary} />
                            ) : (
                                <Circle size={20} color={Colors.text.tertiary} />
                            )}
                            <Text style={[styles.keepLoginText, keepLogin && { color: Colors.primary }]}>
                                Rester connecté
                            </Text>
                        </TouchableOpacity>

                        {errorText ? (
                            <View style={styles.errorContainer}>
                                <AlertCircle size={16} color={Colors.status.error} />
                                <Text style={styles.errorText}>{errorText}</Text>
                            </View>
                        ) : null}

                        <TouchableOpacity
                            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                            onPress={() => onPressLogin(email, password)}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <>
                                    <Text style={styles.loginButtonText}>Se connecter</Text>
                                    <ChevronRight size={20} color="#FFF" />
                                </>
                            )}
                        </TouchableOpacity>

                        {errorText ? (
                            <TouchableOpacity
                                style={styles.ghostButton}
                                onPress={onPressContinueWithoutLogin}
                            >
                                <Text style={styles.ghostButtonText}>Continuer sans connexion</Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </View>

                {/* FOOTER */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>En vous connectant, vous acceptez l'utilisation de vos données ISEN à des fins d'affichage uniquement.</Text>
                </View>
            </KeyboardAvoidingView>
            <Analytics />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    keyboardView: {
        flex: 1,
    },
    contentContainer: {
        flex: 1,
        justifyContent: "center",
        paddingHorizontal: 24,
    },
    // Logo
    logoContainer: {
        alignItems: "center",
        marginBottom: 40,
    },
    logoIcon: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: Colors.primaryLight,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.primary + "20",
    },
    logoTitle: {
        fontSize: 24,
        fontWeight: "800",
        color: Colors.text.primary,
        letterSpacing: -1,
    },
    // Header Text
    headerText: {
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: "800",
        color: Colors.text.primary,
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 15,
        color: Colors.text.secondary,
        marginTop: 4,
    },
    // Form
    form: {
        gap: 16,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: 16,
        height: 56,
        // Subtile shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 2,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: Colors.text.primary,
        fontWeight: "500",
    },
    keepLoginContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 4,
        paddingLeft: 4,
    },
    keepLoginText: {
        fontSize: 14,
        color: Colors.text.secondary,
        fontWeight: "600",
    },
    // Button
    loginButton: {
        flexDirection: "row",
        backgroundColor: Colors.primary,
        height: 56,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 16,
        gap: 8,
        // Shadow
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 6,
    },
    loginButtonDisabled: {
        opacity: 0.7,
    },
    loginButtonText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "700",
    },
    ghostButton: {
        paddingVertical: 12,
        alignItems: "center",
    },
    ghostButtonText: {
        color: Colors.text.secondary,
        fontSize: 14,
        fontWeight: "600",
        textDecorationLine: "underline",
    },
    // Error
    errorContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.status.error + "10",
        padding: 12,
        borderRadius: 12,
        gap: 8,
    },
    errorText: {
        color: Colors.status.error,
        fontSize: 13,
        fontWeight: "600",
        flex: 1,
    },
    // Footer
    footer: {
        padding: 24,
        alignItems: "center",
    },
    footerText: {
        fontSize: 11,
        color: Colors.text.tertiary,
        textAlign: "center",
        lineHeight: 16,
    }
});