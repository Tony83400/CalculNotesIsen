import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect } from "expo-router";
import { ArrowRight, Eye, EyeOff } from "lucide-react-native";
import { useAuth } from "../hooks/useAuth";
import { useAppData } from "../providers/AppData";
import { Brand } from "../components/AppShell";
import { Colors as C } from "../constants/Colors";
import { Theme } from "../constants/Theme";
import { Button, Field, Notice, ui } from "../components/ui/Primitives";
export default function Login() {
  const a = useAuth(),
    app = useAppData(),
    { width } = useWindowDimensions(),
    pass = useRef<TextInput>(null),
    [visible, setVisible] = useState(false);
  if (app.ready && app.user && !app.notes.error?.startsWith("Session expirée"))
    return <Redirect href="/selection" />;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.brand.navy }}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: C.background }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[s.layout, width < 850 && { flexDirection: "column" }]}>
            {width >= 850 && (
              <View style={s.editorial}>
                <Brand light />
                <View style={{ marginTop: 96, gap: 28 }}>
                  <Text style={s.issue}>CalculNotesISEN · espace étudiant</Text>
                  <Text style={s.statement}>
                    Vos cours{"\n"}Vos notes{"\n"}Votre semestre
                  </Text>
                  <Text style={s.intro}>
                    Consultez vos cours, suivez vos moyennes et simulez les
                    évaluations à venir avec votre cursus ISEN.
                  </Text>
                </View>
                <View style={s.sample}>
                  <View style={s.sampleRow}>
                    <Text style={s.sampleLabel}>Agenda</Text>
                    <Text style={s.sampleText}>Cours et examens</Text>
                  </View>
                  <View style={s.sampleRow}>
                    <Text style={s.sampleLabel}>Résultats</Text>
                    <Text style={s.sampleText}>Moyennes et ECTS</Text>
                  </View>
                  <View style={s.sampleRow}>
                    <Text style={s.sampleLabel}>Simulations</Text>
                    <Text style={s.sampleText}>Hypothèses de notes</Text>
                  </View>
                </View>
                <Text style={s.signature}>
                  Un outil étudiant par Anthony Coulais et Mattéo Sautron
                </Text>
              </View>
            )}
            <View style={[s.formSide, width < 850 && { padding: 24 }]}>
              <View style={{ width: "100%", maxWidth: 390, gap: 24 }}>
                {width < 850 && (
                  <View style={{ marginBottom: 28 }}>
                    <Brand />
                  </View>
                )}
                <View style={{ gap: 12 }}>
                  <Text style={s.eyebrow}>Accès étudiant</Text>
                  <Text accessibilityRole="header" style={s.title}>
                    Connexion ISEN
                  </Text>
                  <Text style={ui.small}>
                    Connectez-vous avec vos identifiants ISEN.
                  </Text>
                </View>
                <View style={{ gap: 16 }}>
                  <Field
                    label="Identifiant ISEN"
                    placeholder="prenom.nom"
                    value={a.email}
                    onChangeText={a.setEmail}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="username"
                    textContentType="username"
                    returnKeyType="next"
                    onSubmitEditing={() => pass.current?.focus()}
                    editable={!a.loading}
                  />
                  <View style={{ gap: 8 }}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "500",
                        color: C.text.primary,
                      }}
                    >
                      Mot de passe
                    </Text>
                    <View style={ui.row}>
                      <TextInput
                        ref={pass}
                        accessibilityLabel="Mot de passe"
                        style={s.password}
                        value={a.password}
                        onChangeText={a.setPassword}
                        secureTextEntry={!visible}
                        autoComplete="current-password"
                        textContentType="password"
                        autoCapitalize="none"
                        returnKeyType="go"
                        onSubmitEditing={() =>
                          void a.handleLogin(a.email, a.password)
                        }
                        editable={!a.loading}
                      />
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={
                          visible
                            ? "Masquer le mot de passe"
                            : "Afficher le mot de passe"
                        }
                        onPress={() => setVisible((v) => !v)}
                        style={{
                          minWidth: 44,
                          minHeight: 48,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {visible ? (
                          <EyeOff
                            strokeWidth={1.5}
                            color={C.text.secondary}
                            size={18}
                          />
                        ) : (
                          <Eye
                            strokeWidth={1.5}
                            color={C.text.secondary}
                            size={18}
                          />
                        )}
                      </Pressable>
                    </View>
                  </View>
                  {Platform.OS === "web" ? (
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        minHeight: 44,
                        fontSize: 13,
                        fontFamily: Theme.font.body,
                        color: C.text.secondary,
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={a.keepLogin}
                        disabled={a.loading || !app.ready}
                        onChange={(e) =>
                          a.setKeepLogin(e.currentTarget.checked)
                        }
                        style={{
                          width: 20,
                          height: 20,
                          margin: 0,
                          accentColor: C.primary,
                        }}
                      />
                      Rester connecté sur cet appareil
                    </label>
                  ) : (
                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityLabel="Rester connecté sur cet appareil"
                      accessibilityState={{ checked: a.keepLogin }}
                      disabled={a.loading || !app.ready}
                      onPress={() => a.setKeepLogin(!a.keepLogin)}
                      style={[ui.row, { minHeight: 44 }]}
                    >
                      <View
                        style={[
                          s.checkbox,
                          a.keepLogin && { backgroundColor: C.primary },
                        ]}
                      >
                        <Text style={{ color: "white" }}>
                          {a.keepLogin ? "✓" : ""}
                        </Text>
                      </View>
                      <Text style={ui.small}>
                        Rester connecté sur cet appareil
                      </Text>
                    </Pressable>
                  )}
                  {a.errorText || (!app.user && app.notes.error) ? (
                    <Notice error>{a.errorText || app.notes.error}</Notice>
                  ) : null}
                  <Button
                    label="Ouvrir mon carnet"
                    variant="primary"
                    loading={a.loading || !app.ready}
                    icon={
                      <ArrowRight strokeWidth={1.5} size={18} color="white" />
                    }
                    onPress={() => void a.handleLogin(a.email, a.password)}
                  />
                </View>
                <Text style={ui.small}>
                  {Platform.OS === "web"
                    ? a.keepLogin
                      ? "Connexion mémorisée pendant 7 jours sur cet appareil. Vos identifiants sont protégés par le serveur dans un cookie chiffré."
                      : "Sans cette option, la session se termine au rechargement de la page."
                    : "Les identifiants mémorisés sont protégés par le stockage sécurisé de votre appareil."}
                </Text>
                <View style={[ui.rule, { marginTop: 4 }]} />
                <View style={{ gap: 8 }}>
                  <Button
                    label="Découvrir avec des données fictives"
                    onPress={() => void a.loginWithoutAccount()}
                    disabled={a.loading || !app.ready}
                  />
                  <Text
                    style={[ui.small, { fontSize: 12, textAlign: "center" }]}
                  >
                    Sans compte · aucune donnée personnelle
                  </Text>
                </View>
                <Text style={[ui.small, { fontSize: 11, marginTop: 12 }]}>
                  CalculNotesISEN est un outil indépendant. Les moyennes
                  affichées sont des estimations, pas des résultats certifiés.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  layout: { flex: 1, flexDirection: "row", minHeight: 700 },
  editorial: { width: "47%", backgroundColor: C.brand.navy, padding: 48 },
  issue: { fontSize: 12, letterSpacing: 0, color: C.brand.muted },
  statement: {
    fontFamily: Theme.font.heading,
    fontSize: 56,
    lineHeight: 64,
    color: C.text.inverse,
  },
  intro: { fontSize: 16, lineHeight: 26, color: C.brand.muted, maxWidth: 370 },
  sample: { marginTop: 64, borderTopWidth: 1, borderTopColor: C.brand.border },
  sampleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.brand.border,
    paddingVertical: 16,
  },
  sampleLabel: { fontSize: 12, letterSpacing: 0, color: C.brand.muted },
  sampleText: {
    fontSize: 16,
    color: C.text.inverse,
  },
  signature: { marginTop: 48, fontSize: 11, color: C.brand.muted },
  formSide: {
    flex: 1,
    padding: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0,
    color: C.primary,
  },
  title: {
    fontFamily: Theme.font.heading,
    fontSize: 36,
    lineHeight: 44,
    color: C.text.primary,
  },
  password: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    padding: 12,
    borderWidth: 1,
    borderColor: C.controlBorder,
    backgroundColor: C.surface,
    borderRadius: 6,
    fontSize: 16,
    color: C.text.primary,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderColor: C.controlBorder,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
});
