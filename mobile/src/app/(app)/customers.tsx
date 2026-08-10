import { useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { Search } from "lucide-react-native";
import { BusinessGate } from "@/components/BusinessGate";
import { Card, PageHeader, uiStyles } from "@/components/ui";
import { useBusiness } from "@/providers/BusinessProvider";
import { colors, radii, spacing } from "@/theme/tokens";

export default function CustomersScreen() {
  return <BusinessGate><CustomersContent /></BusinessGate>;
}

function CustomersContent() {
  const { business, refresh } = useBusiness();
  const [query, setQuery] = useState("");
  const customers = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("tr-TR");
    if (!normalized) return business?.customers || [];
    return (business?.customers || []).filter((item) =>
      [item.name, item.phone, item.email, item.instagramUsername]
        .join(" ")
        .toLocaleLowerCase("tr-TR")
        .includes(normalized),
    );
  }, [business?.customers, query]);

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={customers}
      keyExtractor={(item) => item.id}
      onRefresh={() => void refresh()}
      refreshing={false}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={styles.header}>
          <PageHeader title="Müşteriler" subtitle={`${customers.length} kayıt gösteriliyor`} />
          <View style={styles.search}>
            <Search color={colors.textMuted} size={19} />
            <TextInput value={query} onChangeText={setQuery} placeholder="Ad, telefon veya e-posta ara" placeholderTextColor={colors.textMuted} style={styles.searchInput} returnKeyType="search" />
          </View>
        </View>
      }
      ListEmptyComponent={<Card><Text style={uiStyles.body}>Aramanızla eşleşen müşteri bulunamadı.</Text></Card>}
      renderItem={({ item }) => (
        <Card>
          <Text style={styles.name}>{item.name || "İsimsiz müşteri"}</Text>
          {item.phone ? <Text style={uiStyles.body}>{item.countryCode} {item.phone}</Text> : null}
          {item.email ? <Text style={uiStyles.body}>{item.email}</Text> : null}
          {item.notes ? <Text numberOfLines={3} style={styles.notes}>{item.notes}</Text> : null}
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  header: { gap: spacing.md, marginBottom: spacing.xs },
  search: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: spacing.sm, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: spacing.md },
  searchInput: { flex: 1, color: colors.text, fontSize: 15 },
  name: { color: colors.text, fontSize: 16, fontWeight: "800" },
  notes: { color: colors.textMuted, fontSize: 13, lineHeight: 19, backgroundColor: colors.surfaceMuted, borderRadius: radii.sm, padding: spacing.sm },
});
