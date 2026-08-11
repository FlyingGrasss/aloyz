import { useMemo, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { Search } from "lucide-react-native";
import { useLocalSearchParams } from "expo-router";
import { BusinessGate } from "@/components/BusinessGate";
import { EntityManager, type EntityField } from "@/components/EntityManager";
import { Card, PageHeader, ScrollScreen, StatusPill, uiStyles } from "@/components/ui";
import { SelectField } from "@/components/SelectField";
import type { CustomerProfile } from "@/domain/models";
import { useBusiness } from "@/providers/BusinessProvider";
import { useOptionalDashboardChrome } from "@/providers/DashboardChromeProvider";
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
  const chrome = useOptionalDashboardChrome();
  const params = useLocalSearchParams<{ create?: string | string[] }>();
  const [messageFilter, setMessageFilter] = useState("all");
  const [localQuery, setLocalQuery] = useState("");
  const query = chrome?.searchTerm || localQuery;
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
  const messageContacts = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("tr-TR");
    return (business?.conversations || [])
      .filter((conversation) => messageFilter === "all" || conversation.channel === messageFilter)
      .filter((conversation) => {
        if (!normalized) return true;
        return [conversation.customerName, conversation.customerPhone, conversation.instagramUsername, conversation.customerJid]
          .filter(Boolean)
          .some((value) => String(value).toLocaleLowerCase("tr-TR").includes(normalized));
      })
      .sort((left, right) => String(right.updatedAt || "").localeCompare(String(left.updatedAt || "")));
  }, [business?.conversations, messageFilter, query]);

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
          onChangeText={(value) => {
            setLocalQuery(value);
            chrome?.setSearchTerm(value);
          }}
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
        autoOpen={params.create === "1" || (Array.isArray(params.create) && params.create[0] === "1")}
      />
      <Card>
        <Text style={styles.messageTitle}>Mesaj Kişileri</Text>
        <Text style={uiStyles.body}>WhatsApp ve Instagram konuşmalarından gelen kişiler</Text>
        <SelectField label="Kanal" value={messageFilter} options={[{ value: "all", label: "Tümü" }, { value: "whatsapp", label: "WhatsApp" }, { value: "instagram", label: "Instagram" }]} onChange={setMessageFilter} />
        {messageContacts.map((contact) => {
          const name = contact.customerName || contact.instagramUsername || contact.customerPhone || contact.customerJid;
          const messages = Array.isArray(contact.messages) ? contact.messages : [];
          const appointmentCount = allCustomers.find((customer) => customer.name === name)
            ? (business?.appointments || []).filter((appointment) => appointment.customerName === name).length
            : 0;
          return <View key={contact.id} style={styles.messageRow}><View style={styles.messageCopy}><Text style={styles.messageName}>{name}</Text><Text style={uiStyles.body} numberOfLines={2}>{contact.customerPhone || contact.instagramUsername || "-"} · {messages.length} mesaj</Text></View><View style={styles.messageMeta}><StatusPill label={contact.channel === "instagram" ? "Instagram" : "WhatsApp"} /><Text style={styles.appointmentCount}>{appointmentCount} randevu</Text></View></View>;
        })}
        {!messageContacts.length ? <Text style={uiStyles.body}>Mesaj kişisi bulunamadı.</Text> : null}
      </Card>
    </ScrollScreen>
  );
}

const styles = StyleSheet.create({
  search: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: spacing.sm, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: spacing.md },
  searchInput: { flex: 1, color: colors.text, fontSize: 15 },
  messageTitle: { color: colors.text, fontSize: 18, fontWeight: "800" },
  messageRow: { minHeight: 66, flexDirection: "row", alignItems: "center", gap: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingVertical: spacing.md },
  messageCopy: { flex: 1, gap: spacing.xs },
  messageName: { color: colors.text, fontSize: 14, fontWeight: "800" },
  messageMeta: { alignItems: "flex-end", gap: spacing.xs },
  appointmentCount: { color: colors.textMuted, fontSize: 11, fontWeight: "700" },
});
