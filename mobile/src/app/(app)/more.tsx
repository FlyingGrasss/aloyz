import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Building2, Clock3, Download, LogOut, Shield, ScrollText } from "lucide-react-native";
import { BusinessGate } from "@/components/BusinessGate";
import { Button, Card, PageHeader, ScrollScreen, uiStyles } from "@/components/ui";
import { useAuth } from "@/providers/AuthProvider";
import { useBusiness } from "@/providers/BusinessProvider";
import { shareCsv } from "@/services/exportService";
import { colors, radii, spacing } from "@/theme/tokens";

export default function MoreScreen() {
  return <BusinessGate><MoreContent /></BusinessGate>;
}

function MoreContent() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { business } = useBusiness();

  async function exportCustomers() {
    if (!business) return;
    try {
      await shareCsv(`${business.slug}-musteriler.csv`, [
        ["Ad", "Telefon", "E-posta", "Instagram", "Notlar"],
        ...business.customers.map((item) => [item.name, `${item.countryCode}${item.phone}`, item.email, item.instagramUsername, item.notes]),
      ]);
    } catch (caught) {
      Alert.alert("Dosya paylaşılamadı", caught instanceof Error ? caught.message : "Lütfen yeniden deneyin.");
    }
  }

  function confirmSignOut() {
    Alert.alert("Çıkış yapılsın mı?", "Bu cihazdaki Aloyz oturumu kapatılacak.", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Çıkış yap", style: "destructive", onPress: () => void signOut() },
    ]);
  }

  return (
    <ScrollScreen>
      <PageHeader title="Diğer" {...(user?.email ? { subtitle: user.email } : {})} />
      <Text style={uiStyles.sectionTitle}>İşletme ayarları</Text>
      <Card style={styles.menuCard}>
        <MenuRow icon={Building2} label="İşletme bilgileri" onPress={() => router.push("/business/profile")} />
        <MenuRow icon={Clock3} label="Çalışma saatleri" onPress={() => router.push("/business/hours")} />
        <MenuRow icon={Download} label="Müşterileri CSV olarak paylaş" onPress={() => void exportCustomers()} />
      </Card>
      <Text style={uiStyles.sectionTitle}>Yasal</Text>
      <Card style={styles.menuCard}>
        <MenuRow icon={Shield} label="Gizlilik politikası" onPress={() => router.push("/legal/privacy")} />
        <MenuRow icon={ScrollText} label="Kullanım koşulları" onPress={() => router.push("/legal/terms")} />
      </Card>
      <Button variant="danger" icon={LogOut} onPress={confirmSignOut}>Çıkış yap</Button>
    </ScrollScreen>
  );
}

function MenuRow({ icon: Icon, label, onPress }: { icon: typeof Building2; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}>
      <View style={styles.iconBox}><Icon color={colors.primary} size={20} /></View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  menuCard: { padding: spacing.sm, gap: 0 },
  menuRow: { minHeight: 56, flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.sm, borderRadius: radii.md },
  pressed: { backgroundColor: colors.surfaceMuted },
  iconBox: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  menuLabel: { flex: 1, color: colors.text, fontSize: 15, fontWeight: "700" },
  chevron: { color: colors.textMuted, fontSize: 28, lineHeight: 28 },
});
