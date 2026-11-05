import React from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
  type StyleProp,
} from "react-native";
import { Colors as C } from "../../constants/Colors";
import { Theme } from "../../constants/Theme";
export function Button({
  label,
  onPress,
  variant = "default",
  disabled = false,
  loading = false,
  icon,
  style,
  iconOnly = false,
  accessibilityLabel,
  inverse = false,
  selected,
}: {
  label: string;
  accessibilityLabel?: string;
  inverse?: boolean;
  selected?: boolean;
  onPress: () => void;
  variant?: "default" | "primary" | "quiet" | "danger";
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconOnly?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
        selected,
      }}
      disabled={disabled || loading}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        s.button,
        variant === "primary" && s.primary,
        variant === "quiet" && s.quiet,
        hovered &&
          !disabled && {
            backgroundColor:
              variant === "primary" || inverse ? C.brand.panel : C.surfaceMuted,
          },
        disabled && { opacity: 0.5 },
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" ? "white" : C.primary}
        />
      ) : (
        icon
      )}
      {!iconOnly && (
        <Text
          style={[
            s.buttonText,
            variant === "primary" && { color: "white" },
            variant === "danger" && { color: C.status.error },
            inverse && { color: C.text.inverse },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
export function Field({
  label,
  error,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  return (
    <View style={{ gap: 8, flexShrink: 1 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={C.text.tertiary}
        {...props}
        style={[s.input, error && { borderColor: C.status.error }, props.style]}
      />
      {error && (
        <Text
          accessibilityRole="alert"
          style={[s.small, { color: C.status.error }]}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
export function Heading({ children }: { children: React.ReactNode }) {
  return (
    <Text accessibilityRole="header" style={s.heading}>
      {children}
    </Text>
  );
}
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <Text style={s.eyebrow}>{children}</Text>;
}
export function Body({
  children,
  muted = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <Text style={[s.body, muted && { color: C.text.secondary }]}>
      {children}
    </Text>
  );
}
export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "error" | "info";
}) {
  return (
    <View
      style={[
        s.badge,
        {
          backgroundColor:
            tone === "neutral" ? "transparent" : C.status[tone] + "12",
        },
      ]}
    >
      <Text
        style={[
          s.badgeText,
          { color: tone === "neutral" ? C.text.secondary : C.status[tone] },
        ]}
      >
        {children}
      </Text>
    </View>
  );
}
export function Notice({
  children,
  error = false,
}: {
  children: React.ReactNode;
  error?: boolean;
}) {
  return (
    <View
      style={[
        s.notice,
        error && {
          borderLeftColor: C.status.error,
          backgroundColor: C.feedback.errorBackground,
        },
      ]}
    >
      <Text
        accessibilityRole={error ? "alert" : undefined}
        accessibilityLiveRegion="polite"
        style={[s.small, error && { color: C.status.error }]}
      >
        {children}
      </Text>
    </View>
  );
}
export function Empty({ title, detail }: { title: string; detail: string }) {
  return (
    <View style={s.empty}>
      <Text style={[s.heading, { fontSize: 22 }]}>
        {title.replace(/\.$/, "")}
      </Text>
      <Body muted>{detail}</Body>
    </View>
  );
}
export function ResourceStatus({
  status,
  updatedAt,
  error,
  demo = false,
}: {
  status: string;
  updatedAt: string | null;
  error: string | null;
  demo?: boolean;
}) {
  const stamp = updatedAt
    ? new Date(updatedAt).toLocaleString("fr-FR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;
  return (
    <View style={{ gap: 8 }}>
      {!demo && (
        <Text accessibilityLiveRegion="polite" style={s.small}>
          {status === "loading"
            ? "Actualisation en cours…"
            : status === "cache"
              ? `Hors ligne · données conservées${stamp ? " du " + stamp : ""}`
              : status === "network"
                ? `Récupéré le ${stamp}`
                : status === "error"
                  ? "Données indisponibles"
                  : "En attente de données"}
        </Text>
      )}
      {error && <Notice error>{error}</Notice>}
    </View>
  );
}
export const ui = StyleSheet.create({
  panel: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: Theme.radius.panel,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Theme.space.sm,
  },
  section: { gap: 16, marginBottom: 28 },
  small: safeSmall(),
  number: { fontVariant: ["tabular-nums"], color: C.text.primary },
  rule: { height: 1, backgroundColor: C.border },
  label: { fontSize: 12, fontWeight: "500", color: C.text.secondary },
});
function safeSmall() {
  return { fontSize: 13, color: C.text.secondary, lineHeight: 20 } as const;
}
const s = StyleSheet.create({
  button: {
    minHeight: Theme.controlHeight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Theme.space.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: Theme.radius.control,
    gap: Theme.space.sm,
    backgroundColor: C.surface,
  },
  primary: { backgroundColor: C.primary, borderColor: C.primary },
  quiet: { borderColor: "transparent", backgroundColor: "transparent" },
  buttonText: { fontSize: 14, fontWeight: "500", color: C.text.primary },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: C.controlBorder,
    backgroundColor: C.surface,
    borderRadius: Theme.radius.control,
    paddingHorizontal: Theme.space.md,
    paddingVertical: 12,
    fontSize: 16,
    color: C.text.primary,
  },
  label: { fontSize: 13, fontWeight: "500", color: C.text.primary },
  heading: {
    fontSize: 30,
    fontFamily: Theme.font.heading,
    color: C.text.primary,
    lineHeight: 38,
  },
  eyebrow: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    letterSpacing: 0,
    textTransform: "none",
    color: C.text.secondary,
  },
  body: { fontSize: 15, lineHeight: 23, color: C.text.primary },
  small: { fontSize: 13, lineHeight: 20, color: C.text.secondary },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: { fontSize: 12, lineHeight: 16, fontWeight: "500" },
  notice: {
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: C.primary,
    backgroundColor: C.primaryLight,
  },
  empty: { paddingVertical: 32, gap: 8 },
});
