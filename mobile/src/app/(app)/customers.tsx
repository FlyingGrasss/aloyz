import { useMemo, useState } from "react";
import { Alert, StyleSheet, TextInput, View } from "react-native";
import { Search } from "lucide-react-native";
import { BusinessGate } from "@/components/BusinessGate";
import { EntityManager, type EntityField } from "@/components/EntityManager";
import { PageHeader, ScrollScreen } from "@/components/ui";
import type { CustomerProfile } from "@/domain/models";
import { useBusiness } from "@/providers/BusinessProvider";
import { colors, radii, spacing } from "@/theme/tokens";

const customerFields: EntityField[] = [
  { key: "name", label: "Ad soyad", type: "text", required: true },
  { key: "countryCode", label: "Ülke kodu", type: "text", placeholder: "+90" },
  { key: "phone", label: "Telefon", type: "text" },
  { key: "email", label: "E-posta", type: "text" },
  { key: "birthDate", label: "Doğum tarihi", type: "text", placeholder: "YYYY-AA-GG" },
  { key: "gender", label: "Cinsiyet", type: "text" },
  { key: "fileNumber", label: "Dosya numarası", type: "text" },
  { key: "instagramUsername", label: "Instagram kullanıcı adı", type: "text" },
  { key: "discountEnabled", label: "Özel indirim etkin", type: "boolean" },
  { key: "discountRate", label: "İndirim oranı", type: "number" },
  { key: "notes", label: "Notlar", type: "text", multiline: true },
];

export default function CustomersScreen() {
  return <BusinessGate><CustomersContent /></BusinessGate>;
}

function CustomersContent() {
  const { business, save } = useBusiness();
  const [query, setQuery] = useState("");
  const allCustomers = business?.customers || [];
  const customers = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("tr-TR");
    if (!normalized) return allCustomers;
    return allCustomers.filter((item) =>
      [item.name, item.phone, item.email, item.instagramUsername]
        .join(" ")
        .toLocaleLowerCase("tr-TR")
        .includes(normalized),
    );
  }, [allCustomers, query]);

  async function persist(nextVisible: Array<Record<string, unknown> & { id?: string }>) {
    const visibleIds = new Set(customers.map((item) => item.id));
    const untouched = allCustomers.filter((item) => !visibleIds.has(item.id));
    try {
      await save({ customers: [...nextVisible as unknown as CustomerProfile[], ...untouched] });
    } catch (caught) {
      Alert.alert("Müşteriler kaydedilemedi", caught instanceof Error ? caught.message : "Lütfen yeniden deneyin.");
      throw caught;
    }
  }

  return (
    <ScrollScreen>
      <PageHeader title="Müşteriler" subtitle={`${customers.length} kayıt gösteriliyor`} />
      <View style={styles.search}>
        <Search color={colors.textMuted} size={19} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Ad, telefon veya e-posta ara"
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          returnKeyType="search"
        />
      </View>
      <EntityManager
        records={customers as unknown as Array<Record<string, unknown> & { id?: string }>}
        fields={customerFields}
        createLabel="Yeni müşteri"
        createDefaults={{ countryCode: "+90", tags: [], discountEnabled: false, discountRate: 0 }}
        getTitle={(item) => String(item.name || "İsimsiz müşteri")}
        getSubtitle={(item) => [item.countryCode, item.phone, item.email].filter(Boolean).join(" ")}
        onChange={persist}
      />
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  search: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: spacing.sm, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: spacing.md },
  searchInput: { flex: 1, color: colors.text, fontSize: 15 },
});
