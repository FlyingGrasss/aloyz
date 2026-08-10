import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { Save } from "lucide-react-native";
import { BusinessGate } from "@/components/BusinessGate";
import { Button, Field, PageHeader, ScrollScreen } from "@/components/ui";
import { useBusiness } from "@/providers/BusinessProvider";

type ProfileForm = {
  name: string;
  type: string;
  phone: string;
  email: string;
  city: string;
  district: string;
  address: string;
  website: string;
};

export default function ProfileScreen() {
  return <BusinessGate><ProfileFormScreen /></BusinessGate>;
}

function ProfileFormScreen() {
  const { business, save } = useBusiness();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProfileForm>({ name: "", type: "", phone: "", email: "", city: "", district: "", address: "", website: "" });

  useEffect(() => {
    if (!business) return;
    setForm({
      name: business.name,
      type: business.type,
      phone: business.phone || "",
      email: business.email || "",
      city: business.city || "",
      district: business.district || "",
      address: business.address || "",
      website: business.website || "",
    });
  }, [business]);

  function change(key: keyof ProfileForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit() {
    if (!form.name.trim() || !form.type.trim()) {
      Alert.alert("Eksik bilgi", "İşletme adı ve türü zorunludur.");
      return;
    }
    setSaving(true);
    try {
      await save(form);
      Alert.alert("Kaydedildi", "İşletme bilgileri güncellendi.");
    } catch (caught) {
      Alert.alert("Kaydedilemedi", caught instanceof Error ? caught.message : "Lütfen yeniden deneyin.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollScreen>
      <PageHeader title="İşletme bilgileri" subtitle="Web paneliyle aynı işletme profilini günceller." />
      <Field label="İşletme adı" value={form.name} onChangeText={(value) => change("name", value)} />
      <Field label="İşletme türü" value={form.type} onChangeText={(value) => change("type", value)} />
      <Field label="Telefon" value={form.phone} onChangeText={(value) => change("phone", value)} keyboardType="phone-pad" />
      <Field label="E-posta" value={form.email} onChangeText={(value) => change("email", value)} keyboardType="email-address" autoCapitalize="none" />
      <Field label="Şehir" value={form.city} onChangeText={(value) => change("city", value)} />
      <Field label="İlçe" value={form.district} onChangeText={(value) => change("district", value)} />
      <Field label="Adres" value={form.address} onChangeText={(value) => change("address", value)} multiline />
      <Field label="Web sitesi" value={form.website} onChangeText={(value) => change("website", value)} keyboardType="url" autoCapitalize="none" />
      <Button icon={Save} loading={saving} onPress={() => void submit()}>Kaydet</Button>
    </ScrollScreen>
  );
}
