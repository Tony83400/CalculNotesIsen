import React from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, usePathname, type Href } from "expo-router";
import {
  Home,
  NotebookPen,
  CalendarDays,
  Users,
  SlidersHorizontal,
  LogOut,
} from "lucide-react-native";
import { Colors as C } from "../constants/Colors";
import { Theme } from "../constants/Theme";
import { useAppData } from "../providers/AppData";
import { Button, Heading, ui } from "./ui/Primitives";
const routes = [
  { path: "/selection", label: "Accueil", Icon: Home },
  { path: "/notes", label: "Mes notes", Icon: NotebookPen },
  { path: "/agenda", label: "Mon agenda", Icon: CalendarDays },
  { path: "/multi-agenda", label: "Comparer les agendas", Icon: Users },
  { path: "/selectionAnnee", label: "Mon cursus", Icon: SlidersHorizontal },
];
export function Brand({ light = false }: { light?: boolean }) {
  return (
    <View style={{ gap: 12, flexDirection: "row", alignItems: "center" }}>
      <View style={[s.monogram, light && { borderColor: C.brand.coral }]}>
        <Text style={[s.monogramText, light && { color: "white" }]}>cn.</Text>
      </View>
      <View>
        <Text style={[s.brand, light && { color: "white" }]}>
          CalculNotes<Text style={{ fontWeight: "400" }}>ISEN</Text>
        </Text>
        <Text style={[s.brandSub, light && { color: C.brand.muted }]}>
          Carnet étudiant
        </Text>
      </View>
    </View>
  );
}
export default function AppShell({
  title,
  kicker,
  children,
  actions,
  scroll = true,
}: {
  title: string;
  kicker: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  scroll?: boolean;
}) {
  const app = useAppData(),
    path = usePathname(),
    { width } = useWindowDimensions();
  const desktop = width >= 1080;
  const nav = (r: (typeof routes)[number], mobile = false) => {
    const active =
      path === r.path ||
      (r.path === "/agenda" && path === "/multi-agenda" && mobile);
    return (
      <Pressable
        key={r.path}
        accessibilityRole="link"
        accessibilityLabel={r.label}
        accessibilityState={{ selected: active }}
        onPress={() => router.navigate(r.path as Href)}
        style={({ pressed }) => [
          mobile ? s.mobileLink : s.navLink,
          active && (mobile ? s.mobileActive : s.navActive),
          pressed && { opacity: 0.65 },
        ]}
      >
        <r.Icon
          size={18}
          color={
            mobile
              ? active
                ? C.primary
                : C.text.secondary
              : active
                ? C.text.inverse
                : C.brand.muted
          }
          strokeWidth={1.5}
        />
        <Text
          style={[
            mobile ? s.mobileText : s.navText,
            active && {
              color: mobile ? C.primary : C.text.inverse,
              fontWeight: "500",
            },
          ]}
        >
          {r.label}
        </Text>
      </Pressable>
    );
  };
  if (!app.ready)
    return (
      <SafeAreaView style={[s.root, { backgroundColor: C.background }]}>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
          }}
        >
          <ActivityIndicator color={C.primary} />
          <Text style={ui.small}>Ouverture de votre carnet…</Text>
        </View>
      </SafeAreaView>
    );
  const content = (
    <View
      style={[
        s.content,
        { padding: width < 600 ? 20 : 36 },
        !desktop && { paddingBottom: 28 },
      ]}
    >
      <View style={s.pageHeader}>
        <View style={{ gap: 8, flex: 1, minWidth: width < 600 ? 190 : 0 }}>
          <Text style={s.kicker}>{kicker}</Text>
          <Heading>{title}</Heading>
        </View>
        {actions}
      </View>
      {app.demo && (
        <View style={s.demo}>
          <Text style={{ fontSize: 12, color: C.primary }}>
            Mode démo · données fictives
          </Text>
        </View>
      )}
      {app.notes.error?.startsWith("Session expirée") && (
        <View style={s.demo}>
          <Text style={ui.small}>
            Votre session a expiré. Les données conservées restent consultables.
          </Text>
          <Button label="Se reconnecter" onPress={() => router.replace("/")} />
        </View>
      )}
      {!app.user && (
        <View style={s.demo}>
          <Text style={ui.small}>
            Connectez-vous pour retrouver vos données.
          </Text>
          <Button label="Se connecter" onPress={() => router.replace("/")} />
        </View>
      )}
      {children}
      <View style={s.footer}>
        <Text style={s.credits}>
          CalculNotesISEN · Anthony Coulais - Mattéo Sautron
        </Text>
        <Text style={s.credits}>Calculs indicatifs · non officiels</Text>
      </View>
    </View>
  );
  return (
    <SafeAreaView style={s.root} edges={["top", "left", "right", "bottom"]}>
      <View style={s.layout}>
        {desktop && (
          <View style={s.sidebar}>
            <Brand light />
            <View style={{ marginTop: 40, gap: 8 }}>
              {routes.slice(0, 3).map((r) => nav(r))}
            </View>
            <View
              style={[
                ui.rule,
                { marginVertical: 24, backgroundColor: C.brand.border },
              ]}
            />
            <View style={{ gap: 8 }}>{routes.slice(3).map((r) => nav(r))}</View>
            <View style={{ flex: 1 }} />
            <View style={s.cursus}>
              <Text style={[s.kicker, { color: C.brand.muted }]}>
                Votre cursus
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "500",
                  color: C.text.inverse,
                  marginTop: 12,
                }}
              >
                {app.year || "À configurer"} · {app.semester || "—"}
              </Text>
              <Text style={[ui.small, { color: C.brand.muted }]}>
                {(
                  app.majors[app.semester || ""] || "Choisir une filière"
                ).replace(/_/g, " ")}
              </Text>
            </View>
            <Button
              label={app.demo ? "Quitter la démo" : "Se déconnecter"}
              icon={
                <LogOut strokeWidth={1.5} size={18} color={C.brand.muted} />
              }
              inverse
              variant="quiet"
              onPress={() => {
                void app.logout().then(() => router.replace("/"));
              }}
            />
          </View>
        )}
        <View style={s.main}>
          <View style={s.masthead}>
            {desktop ? (
              <Text style={s.mastheadText}>Espace étudiant ISEN</Text>
            ) : (
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Accueil CalculNotesISEN"
                onPress={() => router.navigate("/selection")}
              >
                <Brand light />
              </Pressable>
            )}
            <View style={ui.row}>
              {desktop && (
                <Text style={[ui.small, { color: C.brand.muted }]}>
                  {new Date().toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </Text>
              )}
              {!desktop && (
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel="Réglages du cursus"
                  onPress={() => router.navigate("/selectionAnnee")}
                  style={s.settings}
                >
                  <SlidersHorizontal
                    strokeWidth={1.5}
                    size={18}
                    color={C.text.inverse}
                  />
                </Pressable>
              )}
            </View>
          </View>
          {scroll ? (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
            >
              {content}
            </ScrollView>
          ) : (
            content
          )}
          {!desktop && (
            <View style={s.mobileNav}>
              {routes.slice(0, 3).map((r) => nav(r, true))}
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
export function RouteLink({ label, to }: { label: string; to: Href }) {
  return (
    <Button label={label} variant="quiet" onPress={() => router.navigate(to)} />
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.brand.navy },
  layout: { flex: 1, flexDirection: "row" },
  sidebar: {
    width: 256,
    padding: 20,
    borderRightWidth: 1,
    borderRightColor: C.border,
    backgroundColor: C.brand.navy,
  },
  monogram: {
    width: 36,
    height: 36,
    borderWidth: 1.5,
    borderColor: C.primary,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  monogramText: {
    fontFamily: Theme.font.heading,
    fontSize: 24,
    color: C.primary,
  },
  brand: {
    fontSize: 16,
    fontWeight: "600",
    color: C.text.primary,
    letterSpacing: 0,
  },
  brandSub: {
    fontSize: 11,
    letterSpacing: 0,
    color: C.text.secondary,
    marginTop: 4,
  },
  navLink: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    minHeight: 44,
    borderLeftWidth: 3,
    borderLeftColor: "transparent",
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  navActive: { backgroundColor: C.brand.panel, borderLeftColor: C.brand.coral },
  navText: { fontSize: 14, color: C.brand.muted },
  main: { flex: 1, minWidth: 0, backgroundColor: C.background },
  masthead: {
    backgroundColor: C.brand.navy,
    minHeight: 64,
    paddingHorizontal: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  mastheadText: {
    fontSize: 12,
    letterSpacing: 0,
    fontWeight: "500",
    color: C.brand.muted,
  },
  settings: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { width: "100%", maxWidth: 1420, alignSelf: "center", flexGrow: 1 },
  pageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 24,
  },
  kicker: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0,
    color: C.text.secondary,
  },
  demo: {
    paddingVertical: 12,
    paddingHorizontal: 0,
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    marginBottom: 24,
    gap: 12,
  },
  footer: {
    marginTop: 40,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: C.border,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  credits: { fontSize: 11, color: C.text.secondary },
  cursus: {
    paddingVertical: 24,
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: C.brand.border,
  },
  mobileNav: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.surface,
    paddingTop: 4,
    paddingBottom: 4,
  },
  mobileLink: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minHeight: 60,
    borderTopWidth: 2,
    borderTopColor: "transparent",
  },
  mobileActive: { borderTopColor: C.brand.coral },
  mobileText: { fontSize: 11, color: C.text.secondary },
});
