import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Redirect } from "expo-router";
import { LogIn } from "lucide-react-native";
import { Button, Card, Field, ScrollScreen } from "@/components/ui";
import { useAuth } from "@/providers/AuthProvider";
import { colors, spacing } from "@/theme/tokens";

export default function LoginScreen() {
  const { status, signIn, signInWithPassword } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (status === "authenticated") return <Redirect href="/(app)" />;

  async function handleSignIn() {
    setGoogleLoading(true);
    setError(null);
    try {
      await signIn();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Giriş tamamlanamadı.");
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handlePasswordSignIn() {
    if (!email.trim() || !password) {
      setError("E-posta ve şifre alanlarını doldurun.");
      return;
    }
    setPasswordLoading(true);
    setError(null);
    try {
      await signInWithPassword(email, password);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Giriş tamamlanamadı.");
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <ScrollScreen>
      <View style={styles.brand}>
        <Image source={require("../../assets/logo.jpg")} style={styles.logo} accessibilityLabel="Aloyz" />
      </View>
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Aloyz</Text>
        <Text style={styles.copy}>
          Google hesabınızla veya yöneticinizin oluşturduğu şifreyle giriş yapın.
        </Text>
        <Field label="E-posta" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
        <Field label="Şifre" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button onPress={() => void handlePasswordSignIn()} loading={passwordLoading}>
          E-posta ile giriş yap
        </Button>
        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>veya</Text>
          <View style={styles.divider} />
        </View>
        <Button onPress={() => void handleSignIn()} loading={googleLoading} icon={LogIn} variant="secondary">
          Google ile devam et
        </Button>
      </Card>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: "center", marginTop: spacing.xl, marginBottom: spacing.xl },
  logo: { width: 52, height: 52, borderRadius: 12 },
  card: { gap: spacing.lg },
  cardTitle: { color: colors.text, fontSize: 20, fontWeight: "800" },
  copy: { color: colors.textMuted, fontSize: 14, lineHeight: 21 },
  error: { color: colors.danger, fontSize: 13, fontWeight: "600" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  divider: { height: StyleSheet.hairlineWidth, flex: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
});
