import { useEffect, useState } from "react";
import { Alert, Text } from "react-native";
import { Save } from "lucide-react-native";
import { BusinessGate } from "@/components/BusinessGate";
import { Button, Card, Field, PageHeader, ScrollScreen, uiStyles } from "@/components/ui";
import { useBusiness } from "@/providers/BusinessProvider";

const days = [
  ["pazartesi", "Pazartesi"],
  ["sali", "Salı"],
  ["carsamba", "Çarşamba"],
  ["persembe", "Perşembe"],
  ["cuma", "Cuma"],
  ["cumartesi", "Cumartesi"],
  ["pazar", "Pazar"],
] as const;

export default function HoursScreen() {
  return <BusinessGate><HoursForm /></BusinessGate>;
}

function HoursForm() {
  const { business, save } = useBusiness();
  const [hours, setHours] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (business) setHours({ ...business.hours });
  }, [business]);

  async function submit() {
    setSaving(true);
    try {
      await save({ hours });
      Alert.alert("Kaydedildi", "Çalışma saatleri güncellendi.");
    } catch (caught) {
      Alert.alert("Kaydedilemedi", caught instanceof Error ? caught.message : "Lütfen yeniden deneyin.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollScreen>
      <PageHeader title="Çalışma saatleri" subtitle={'Saatleri “09:00 - 18:00” biçiminde, kapalı günleri “Kapalı” olarak girin.'} />
      {days.map(([key, label]) => (
        <Card key={key}>
          <Text style={uiStyles.sectionTitle}>{label}</Text>
          <Field label="Saat aralığı" value={hours[key] || ""} onChangeText={(value) => setHours((current) => ({ ...current, [key]: value }))} placeholder="09:00 - 18:00" autoCapitalize="sentences" />
        </Card>
      ))}
      <Button icon={Save} loading={saving} onPress={() => void submit()}>Kaydet</Button>
    </ScrollScreen>
  );
}
