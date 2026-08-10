import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { type Href, useRouter } from "expo-router";
import { Download, LogOut, Shield, ScrollText } from "lucide-react-native";
import { BusinessGate } from "@/components/BusinessGate";
import { Button, Card, PageHeader, ScrollScreen, uiStyles } from "@/components/ui";
import { dashboardFeatureGroups, encodeFeatureId } from "@/domain/dashboardNavigation";
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
      <PageHeader title="Tüm özellikler" {...(user?.email ? { subtitle: user.email } : {})} />
      {dashboardFeatureGroups.map((group) => (
        <View key={group.label} style={styles.group}>
          <Text style={uiStyles.sectionTitle}>{group.label}</Text>
          <Card style={styles.menuCard}>
            {group.items.map((item) => (
              <MenuRow
                key={item.id}
                label={item.label}
                onPress={() => router.push(`/feature/${encodeFeatureId(item.id)}` as Href)}
              />
            ))}
          </Card>
        </View>
      ))}
      <Text style={uiStyles.sectionTitle}>Dışa aktarma ve yasal</Text>
      <Card style={styles.menuCard}>
        <MenuRow label="Müşterileri CSV olarak paylaş" icon={<Download color={colors.primary} size={19} />} onPress={() => void exportCustomers()} />
        <MenuRow label="Gizlilik politikası" icon={<Shield color={colors.primary} size={19} />} onPress={() => router.push("/legal/privacy")} />
        <MenuRow label="Kullanım koşulları" icon={<ScrollText color={colors.primary} size={19} />} onPress={() => router.push("/legal/terms")} />
      </Card>
      <Button variant="danger" icon={LogOut} onPress={confirmSignOut}>Çıkış yap</Button>
    </ScrollScreen>
  );
}

function MenuRow({ label, icon, onPress }: { label: string; icon?: React.ReactNode; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}>
      {icon ? <View style={styles.iconBox}>{icon}</View> : null}
      <Text style={styles.menuLabel}>{label}</Text>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  menuCard: { padding: spacing.sm, gap: 0 },
  menuRow: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.sm, borderRadius: radii.md },
  pressed: { backgroundColor: colors.surfaceMuted },
  iconBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  menuLabel: { flex: 1, color: colors.text, fontSize: 15, fontWeight: "700" },
  chevron: { color: colors.textMuted, fontSize: 28, lineHeight: 28 },
});
