import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { Building2 } from "lucide-react-native";
import { Button, Field, PageHeader, ScrollScreen } from "@/components/ui";
import { useBusiness } from "@/providers/BusinessProvider";
import { businessService } from "@/services/businessService";

export default function OnboardingScreen() {
  const router = useRouter();
  const { refresh } = useBusiness();
  const [name, setName] = useState("");
  const [type, setType] = useState("İşletme");
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!name.trim()) {
      Alert.alert("Eksik bilgi", "İşletme adı zorunludur.");
      return;
    }
    setSaving(true);
    try {
      await businessService.onboard({ name, type, phone, instagram });
      await refresh();
      router.replace("/(app)");
    } catch (caught) {
      Alert.alert("İşletme oluşturulamadı", caught instanceof Error ? caught.message : "Lütfen yeniden deneyin.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollScreen>
      <PageHeader title="İşletmenizi oluşturun" subtitle="Temel bilgileri daha sonra işletme ayarlarından güncelleyebilirsiniz." />
      <Field label="İşletme adı" value={name} onChangeText={setName} />
      <Field label="İşletme türü" value={type} onChangeText={setType} />
      <Field label="Telefon" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Field label="Instagram kullanıcı adı" value={instagram} onChangeText={setInstagram} autoCapitalize="none" placeholder="kullaniciadi" />
      <Button icon={Building2} loading={saving} onPress={() => void submit()}>İşletme oluştur</Button>
    </ScrollScreen>
  );
}
