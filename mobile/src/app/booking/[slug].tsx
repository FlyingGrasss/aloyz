import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { CalendarCheck, CheckCircle2 } from "lucide-react-native";
import { Button, Card, Field, LoadingState, MessageState, PageHeader, ScrollScreen, uiStyles } from "@/components/ui";
import type { PublicBookingData } from "@/domain/models";
import { bookingService } from "@/services/bookingService";
import { colors, radii, spacing } from "@/theme/tokens";

const ANY_STAFF = "any";

export default function BookingScreen() {
  const params = useLocalSearchParams<{ slug?: string | string[] }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] || "" : params.slug || "";
  const [data, setData] = useState<PublicBookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState("");
  const [staffId, setStaffId] = useState(ANY_STAFF);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  async function load(selection?: { serviceId?: string; staffId?: string; date?: string }) {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const next = await bookingService.get(slug, selection);
      setData(next);
      setServiceId(next.selected.serviceId);
      setStaffId(next.selected.staffId || ANY_STAFF);
      setDate(next.selected.date);
      setTime("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Randevu bilgileri alınamadı.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [slug]);

  const staffOptions = useMemo(() => {
    if (!data) return [];
    const service = data.business.services.find((item) => item.id === serviceId);
    const online = data.business.staff.filter((item) => item.onlineBooking !== false);
    if (!service?.staffIds.length) return online;
    return online.filter((item) => service.staffIds.includes(item.id));
  }, [data, serviceId]);

  async function submit() {
    if (!serviceId || !date || !time || !customerName.trim() || !phone.trim()) {
      Alert.alert("Eksik bilgi", "Hizmet, tarih, saat, ad soyad ve telefon alanlarını doldurun.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await bookingService.create(slug, { serviceId, staffId, date, time, customerName, phone, note });
      setSuccess(`${result.appointment.date} saat ${result.appointment.time} · ${result.appointment.staffName}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Randevu oluşturulamadı.");
    } finally {
      setSaving(false);
    }
  }

  if (loading && !data) return <View style={styles.fill}><LoadingState label="Randevu sayfası yükleniyor..." /></View>;
  if (!data) return <View style={styles.fill}><MessageState title="Randevu sayfası açılamadı" message={error || "İşletme bulunamadı."} /></View>;

  if (success) {
    return (
      <ScrollScreen>
        <Card style={styles.successCard}>
          <CheckCircle2 color={colors.success} size={52} />
          <Text style={styles.successTitle}>Randevunuz alındı</Text>
          <Text style={[uiStyles.body, styles.centerText]}>{success}</Text>
        </Card>
      </ScrollScreen>
    );
  }

  return (
    <ScrollScreen>
      <PageHeader title={data.business.name} subtitle={[data.business.type, data.business.district, data.business.city].filter(Boolean).join(" · ")} />

      <Text style={uiStyles.sectionTitle}>Hizmet seçin</Text>
      {data.business.services.map((item) => (
        <Choice key={item.id} selected={serviceId === item.id} title={item.name} subtitle={`${item.duration || 30} dk`} onPress={() => void load({ serviceId: item.id, staffId: ANY_STAFF, date })} />
      ))}

      <Text style={uiStyles.sectionTitle}>Personel seçin</Text>
      <Choice selected={staffId === ANY_STAFF} title="Fark etmez" subtitle="Müsait olan personel" onPress={() => void load({ serviceId, staffId: ANY_STAFF, date })} />
      {staffOptions.map((item) => (
        <Choice key={item.id} selected={staffId === item.id} title={item.name} subtitle={item.role || "Personel"} onPress={() => void load({ serviceId, staffId: item.id, date })} />
      ))}

      <Text style={uiStyles.sectionTitle}>Tarih seçin</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {data.dates.map((item) => <Chip key={item.value} label={item.label} selected={date === item.value} onPress={() => void load({ serviceId, staffId, date: item.value })} />)}
      </ScrollView>

      <Text style={uiStyles.sectionTitle}>Saat seçin</Text>
      <View style={styles.slotGrid}>
        {data.slots.map((slot) => <Chip key={slot} label={slot} selected={time === slot} onPress={() => setTime(slot)} />)}
      </View>
      {!data.slots.length ? <Card><Text style={uiStyles.body}>Bu seçim için uygun saat bulunamadı.</Text></Card> : null}

      <Text style={uiStyles.sectionTitle}>Bilgileriniz</Text>
      <Field label="Ad soyad" value={customerName} onChangeText={setCustomerName} autoComplete="name" />
      <Field label="Telefon" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" />
      <Field label="Not" value={note} onChangeText={setNote} multiline placeholder="İsteğe bağlı" />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button icon={CalendarCheck} loading={saving} disabled={!data.slots.length} onPress={() => void submit()}>Randevu al</Button>
    </ScrollScreen>
  );
}

function Choice({ selected, title, subtitle, onPress }: { selected: boolean; title: string; subtitle: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.choice, selected && styles.choiceSelected]}>
      <Text style={[styles.choiceTitle, selected && styles.choiceTextSelected]}>{title}</Text>
      <Text style={[styles.choiceSubtitle, selected && styles.choiceSubtitleSelected]}>{subtitle}</Text>
    </Pressable>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.choiceTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.background },
  choice: { borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md, gap: spacing.xs },
  choiceSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  choiceTitle: { color: colors.text, fontSize: 15, fontWeight: "800" },
  choiceSubtitle: { color: colors.textMuted, fontSize: 13 },
  choiceTextSelected: { color: colors.white },
  choiceSubtitleSelected: { color: "#DCE8F7" },
  chips: { gap: spacing.sm, paddingRight: spacing.lg },
  slotGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { minHeight: 42, minWidth: 68, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: spacing.md, alignItems: "center", justifyContent: "center" },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 13, fontWeight: "800" },
  error: { color: colors.danger, fontSize: 13, fontWeight: "700" },
  successCard: { alignItems: "center", paddingVertical: 48 },
  successTitle: { color: colors.text, fontSize: 24, fontWeight: "900" },
  centerText: { textAlign: "center" },
});
