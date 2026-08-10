import { useMemo, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Check, X } from "lucide-react-native";
import { BusinessGate } from "@/components/BusinessGate";
import { Card, PageHeader, StatusPill, uiStyles } from "@/components/ui";
import type { Appointment } from "@/domain/models";
import { appointmentStatusLabel, formatDate, statusTone } from "@/domain/format";
import { useBusiness } from "@/providers/BusinessProvider";
import { businessService } from "@/services/businessService";
import { colors, radii, spacing } from "@/theme/tokens";

export default function AppointmentsScreen() {
  return <BusinessGate><AppointmentsContent /></BusinessGate>;
}

function AppointmentsContent() {
  const { business, refresh } = useBusiness();
  const [savingId, setSavingId] = useState<string | null>(null);
  const appointments = useMemo(
    () => [...(business?.appointments || [])].sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)),
    [business?.appointments],
  );

  async function setStatus(appointment: Appointment, status: "CONFIRMED" | "CANCELED") {
    setSavingId(appointment.id);
    try {
      await businessService.updateAppointmentStatus(appointment.id, status);
      await refresh();
    } catch (caught) {
      Alert.alert("Randevu güncellenemedi", caught instanceof Error ? caught.message : "Lütfen yeniden deneyin.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={appointments}
      keyExtractor={(item) => item.id}
      refreshing={false}
      onRefresh={() => void refresh()}
      ListHeaderComponent={<PageHeader title="Randevular" subtitle={`${appointments.length} kayıt`} />}
      ListEmptyComponent={<Card><Text style={uiStyles.body}>Henüz randevu bulunmuyor.</Text></Card>}
      renderItem={({ item }) => (
        <Card>
          <View style={uiStyles.between}>
            <View style={styles.grow}>
              <Text style={styles.name}>{item.customerName}</Text>
              <Text style={uiStyles.body}>{formatDate(item.date)} · {item.time}</Text>
            </View>
            <StatusPill label={appointmentStatusLabel(item.status)} tone={statusTone(item.status)} />
          </View>
          <Text style={uiStyles.body}>{item.phone}{item.description ? ` · ${item.description}` : ""}</Text>
          {item.status === "REQUESTED" ? (
            <View style={styles.actions}>
              <ActionButton label="Onayla" icon={Check} onPress={() => void setStatus(item, "CONFIRMED")} disabled={savingId === item.id} />
              <ActionButton label="İptal et" icon={X} danger onPress={() => void setStatus(item, "CANCELED")} disabled={savingId === item.id} />
            </View>
          ) : null}
        </Card>
      )}
    />
  );
}

function ActionButton({ label, icon: Icon, onPress, danger = false, disabled }: { label: string; icon: typeof Check; onPress: () => void; danger?: boolean; disabled: boolean }) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.action, danger && styles.actionDanger, disabled && styles.disabled]}>
      <Icon size={16} color={danger ? colors.danger : colors.success} />
      <Text style={[styles.actionText, danger && styles.actionTextDanger]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  grow: { flex: 1 },
  name: { color: colors.text, fontSize: 16, fontWeight: "800" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  action: { flexDirection: "row", alignItems: "center", gap: spacing.xs, borderRadius: radii.md, backgroundColor: colors.successSoft, paddingHorizontal: spacing.md, paddingVertical: 10 },
  actionDanger: { backgroundColor: colors.dangerSoft },
  actionText: { color: colors.success, fontSize: 13, fontWeight: "800" },
  actionTextDanger: { color: colors.danger },
  disabled: { opacity: 0.45 },
});
