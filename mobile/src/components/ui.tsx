import type { PropsWithChildren, ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
  type StyleProp,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { LucideIcon } from "lucide-react-native";
import { useOptionalDashboardChrome } from "@/providers/DashboardChromeProvider";
import { colors, radii, spacing } from "@/theme/tokens";

export function Screen({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  const chrome = useOptionalDashboardChrome();
  return <SafeAreaView style={[styles.screen, style]} edges={chrome ? ["left", "right"] : ["top", "left", "right"]}>{children}</SafeAreaView>;
}

export function ScrollScreen({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  const chrome = useOptionalDashboardChrome();
  return (
    <SafeAreaView style={[styles.screen, style]} edges={chrome ? ["left", "right"] : ["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function PageHeader({ title, subtitle, dark = false }: { title: string; subtitle?: string; dark?: boolean }) {
  return (
    <View style={styles.header}>
      <Text style={[styles.title, dark && styles.darkTitle]} numberOfLines={1}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, dark && styles.darkSubtitle]}>{subtitle}</Text> : null}
    </View>
  );
}

export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

type ButtonProps = PropsWithChildren<{
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
  icon?: LucideIcon;
}>;

export function Button({
  children,
  onPress,
  disabled = false,
  variant = "primary",
  loading = false,
  icon: Icon,
}: ButtonProps) {
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "secondary" && styles.buttonSecondary,
        variant === "danger" && styles.buttonDanger,
        pressed && !inactive && styles.buttonPressed,
        inactive && styles.buttonDisabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "secondary" ? colors.primary : colors.white} />
      ) : (
        <>
          {Icon ? (
            <Icon
              size={18}
              color={variant === "secondary" ? colors.primary : colors.white}
            />
          ) : null}
          <Text
            style={[
              styles.buttonText,
              variant === "secondary" && styles.buttonTextSecondary,
            ]}
          >
            {children}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function Field({
  label,
  multiline,
  ...props
}: TextInputProps & { label: string }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, multiline && styles.multilineInput, props.style]}
      />
    </View>
  );
}

export function LoadingState({ label = "Yükleniyor..." }: { label?: string }) {
  return (
    <View style={styles.centerState}>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={styles.stateText}>{label}</Text>
    </View>
  );
}

export function MessageState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <Card style={styles.messageCard}>
      <Text style={styles.messageTitle}>{title}</Text>
      <Text style={styles.subtitle}>{message}</Text>
      {action ? <View style={styles.messageAction}>{action}</View> : null}
    </Card>
  );
}

export function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  return (
    <View
      style={[
        styles.pill,
        tone === "success" && styles.pillSuccess,
        tone === "warning" && styles.pillWarning,
        tone === "danger" && styles.pillDanger,
      ]}
    >
      <Text
        style={[
          styles.pillText,
          tone === "success" && styles.pillTextSuccess,
          tone === "warning" && styles.pillTextWarning,
          tone === "danger" && styles.pillTextDanger,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export const uiStyles = StyleSheet.create({
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: "700" },
  body: { color: colors.textMuted, fontSize: 14, lineHeight: 21 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  between: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.md },
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  header: { gap: spacing.xs, marginBottom: spacing.xs },
  headerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  headerLogo: { width: 34, height: 34, borderRadius: 8 },
  headerCopy: { flex: 1, minWidth: 0 },
  headerMenu: { width: 38, height: 38, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceMuted },
  eyebrow: { color: colors.brand, fontSize: 11, fontWeight: "800", letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: 22, fontWeight: "700", letterSpacing: -0.25 },
  darkTitle: { color: colors.white },
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 21 },
  darkSubtitle: { color: "#CBD5E1" },
  darkHeaderMenu: { backgroundColor: "#1F2937" },
  card: {
    borderRadius: radii.sm,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  button: {
    minHeight: 48,
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  buttonSecondary: { backgroundColor: colors.primarySoft },
  buttonDanger: { backgroundColor: colors.danger },
  buttonPressed: { opacity: 0.82 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: colors.white, fontSize: 15, fontWeight: "700" },
  buttonTextSecondary: { color: colors.primary },
  fieldGroup: { gap: spacing.sm },
  label: { color: colors.text, fontSize: 13, fontWeight: "700" },
  input: {
    minHeight: 48,
    borderRadius: radii.sm,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.surface,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
  },
  multilineInput: { minHeight: 96, maxHeight: 180, textAlignVertical: "top" },
  centerState: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md, padding: spacing.xl },
  stateText: { color: colors.textMuted, fontWeight: "600" },
  messageCard: { margin: spacing.lg },
  messageTitle: { color: colors.text, fontSize: 18, fontWeight: "800" },
  messageAction: { marginTop: spacing.sm },
  pill: { alignSelf: "flex-start", borderRadius: radii.pill, backgroundColor: colors.surfaceMuted, paddingHorizontal: 10, paddingVertical: 5 },
  pillSuccess: { backgroundColor: colors.successSoft },
  pillWarning: { backgroundColor: colors.warningSoft },
  pillDanger: { backgroundColor: colors.dangerSoft },
  pillText: { color: colors.textMuted, fontSize: 11, fontWeight: "800" },
  pillTextSuccess: { color: colors.success },
  pillTextWarning: { color: colors.warning },
  pillTextDanger: { color: colors.danger },
});
