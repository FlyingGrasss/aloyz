import { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Check, X } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BusinessGate } from "@/components/BusinessGate";
import { Button, Card, PageHeader, StatusPill, uiStyles } from "@/components/ui";
import { SelectField, type SelectOption } from "@/components/SelectField";
import type { Appointment, Business } from "@/domain/models";
import { appointmentStatusLabel, formatDate, statusTone } from "@/domain/format";
import { useBusiness } from "@/providers/BusinessProvider";
import { businessService } from "@/services/businessService";
import { colors, radii, spacing } from "@/theme/tokens";

type AppointmentRow = {
  id: string;
  rawId: string;
  kind: "appointment" | "checkout";
  customerName: string;
  phone: string;
  date: string;
  time: string;
  description: string;
  status: string;
  sourceKey: string;
  source: string;
  staffId: string;
  serviceId: string;
};

export default function AppointmentsScreen() {
  return <BusinessGate><AppointmentsContent /></BusinessGate>;
}

function AppointmentsContent() {
  const { business, refresh } = useBusiness();
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [staffFilter, setStaffFilter] = useState("all");
  const [selectedRow, setSelectedRow] = useState<AppointmentRow | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const rows = useMemo(() => {
    if (!business) return [];
    const checkoutRows: AppointmentRow[] = business.checkouts.map((checkout) => {
      const customer = business.customers.find((item) => item.id === checkout.customerId || item.name === checkout.customerName);
      const staffId = checkout.staffId || String(checkout.lines?.[0]?.staffId || "");
      return {
        id: `checkout-${checkout.id}`,
        rawId: checkout.id,
        kind: "checkout",
        customerName: checkout.customerName,
        phone: customer?.phone || "-",
        date: checkout.date,
        time: `${checkout.hour}:${checkout.minute}`,
        description: checkoutLineNames(checkout, business),
        status: checkout.attendance || checkout.status || "-",
        sourceKey: "checkout",
        source: "Adisyon",
        staffId,
        serviceId: checkout.serviceId || String(checkout.lines?.[0]?.serviceId || ""),
      };
    });
    const appointmentRows: AppointmentRow[] = business.appointments.map((appointment) => {
      const sourceKey = appointmentSourceKey(appointment);
      return {
        id: `appointment-${appointment.id}`,
        rawId: appointment.id,
        kind: "appointment",
        customerName: appointment.customerName,
        phone: appointment.phone || "-",
        date: appointment.date,
        time: appointment.time,
        description: appointment.description || "-",
        status: appointment.status,
        sourceKey,
        source: appointmentSourceLabel(sourceKey),
        staffId: appointment.staffId || "",
        serviceId: appointment.serviceId || "",
      };
    });
    return [...checkoutRows, ...appointmentRows].sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`));
  }, [business]);

  const filteredRows = useMemo(
    () => rows.filter((row) =>
      (sourceFilter === "all" || row.sourceKey === sourceFilter) &&
      (statusFilter === "all" || row.status === statusFilter) &&
      (staffFilter === "all" || row.staffId === staffFilter),
    ),
    [rows, sourceFilter, statusFilter, staffFilter],
  );

  if (!business) return null;

  async function setStatus(row: AppointmentRow, status: "CONFIRMED" | "COMPLETED" | "CANCELED") {
    if (row.kind !== "appointment") return;
    setSavingId(row.id);
    try {
      const result = await businessService.updateAppointmentStatus(row.rawId, status);
      await refresh();
      setSelectedRow((current) => current?.id === row.id ? { ...current, status: result.appointment.status } : current);
    } catch (caught) {
      Alert.alert("Randevu güncellenemedi", caught instanceof Error ? caught.message : "Lütfen yeniden deneyin.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <>
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.content}
        data={filteredRows}
        keyExtractor={(item) => item.id}
        refreshing={false}
        onRefresh={() => void refresh()}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <PageHeader title="Randevular" subtitle={`${filteredRows.length} kayıt`} />
            <Card style={styles.filterCard}>
              <SelectField label="Kaynak" value={sourceFilter} options={sourceOptions} onChange={setSourceFilter} />
              <SelectField label="Durum" value={statusFilter} options={statusOptions} onChange={setStatusFilter} />
              <SelectField
                label="Personel"
                value={staffFilter}
                options={[{ value: "all", label: "Tüm personel" }, ...business.staff.map((staff) => ({ value: staff.id, label: staff.name, subtitle: staff.role }))]}
                onChange={setStaffFilter}
              />
            </Card>
          </View>
        }
        ListEmptyComponent={<Card><Text style={uiStyles.body}>Randevu yok.</Text></Card>}
        renderItem={({ item }) => (
          <Card>
            <View style={uiStyles.between}>
              <View style={styles.grow}>
                <Text style={styles.name}>{item.customerName}</Text>
                <Text style={uiStyles.body}>{formatDate(item.date)} · {item.time}</Text>
              </View>
              <StatusPill label={item.kind === "appointment" ? appointmentStatusLabel(item.status as Appointment["status"]) : item.status} tone={item.kind === "appointment" ? statusTone(item.status as Appointment["status"]) : "neutral"} />
            </View>
            <Text style={uiStyles.body}>{item.phone} · {item.description}</Text>
            <View style={styles.metaRow}><Text style={styles.meta}>{item.source}</Text>{staffName(item, business) ? <Text style={styles.meta}>{staffName(item, business)}</Text> : null}</View>
            <View style={styles.actions}>
              <Button variant="secondary" onPress={() => setSelectedRow(item)}>Detay</Button>
              {item.kind === "appointment" && item.status === "REQUESTED" ? <ActionButton label="Onayla" icon={Check} onPress={() => void setStatus(item, "CONFIRMED")} disabled={savingId === item.id} /> : null}
              {item.kind === "appointment" && item.status === "CONFIRMED" ? <ActionButton label="Tamamlandı" icon={Check} onPress={() => void setStatus(item, "COMPLETED")} disabled={savingId === item.id} /> : null}
              {item.kind === "appointment" && item.status !== "CANCELED" ? <ActionButton label="İptal" icon={X} danger onPress={() => void setStatus(item, "CANCELED")} disabled={savingId === item.id} /> : null}
            </View>
          </Card>
        )}
      />
      <AppointmentDetail row={selectedRow} business={business} onClose={() => setSelectedRow(null)} />
    </>
  );
}

function AppointmentDetail({ row, business, onClose }: { row: AppointmentRow | null; business: Business; onClose: () => void }) {
  return (
    <Modal visible={Boolean(row)} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modal} edges={["top", "bottom", "left", "right"]}>
        <View style={styles.modalHeader}><View style={styles.grow}><Text style={styles.modalTitle}>Randevu detayı</Text><Text style={uiStyles.body}>{row?.customerName}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Kapat" onPress={onClose} style={styles.close}><X color={colors.text} size={22} /></Pressable></View>
        {row ? <ScrollView contentContainerStyle={styles.detailContent}>
          <DetailRow label="Telefon" value={row.phone} />
          <DetailRow label="Tarih" value={`${row.date} ${row.time}`} />
          <DetailRow label="Durum" value={row.kind === "appointment" ? appointmentStatusLabel(row.status as Appointment["status"]) : row.status} />
          <DetailRow label="Kaynak" value={row.source} />
          <DetailRow label="Personel" value={staffName(row, business) || "Belirtilmedi"} />
          <DetailRow label="Hizmet" value={business.services.find((service) => service.id === row.serviceId)?.name || row.description} />
          <DetailRow label="Not" value={row.description || "-"} />
        </ScrollView> : null}
      </SafeAreaView>
    </Modal>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.detailRow}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>;
}

function ActionButton({ label, icon: Icon, onPress, danger = false, disabled }: { label: string; icon: typeof Check; onPress: () => void; danger?: boolean; disabled: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.action, danger && styles.actionDanger, disabled && styles.disabled]}><Icon size={16} color={danger ? colors.danger : colors.success} /><Text style={[styles.actionText, danger && styles.actionTextDanger]}>{label}</Text></Pressable>;
}

function staffName(row: AppointmentRow, business: Business) {
  return business.staff.find((staff) => staff.id === row.staffId)?.name || "";
}

function appointmentSourceKey(appointment: Appointment) {
  const source = String(appointment.source || "").toLowerCase();
  if (source.includes("bot")) return "bot";
  if (source.includes("google")) return "google";
  if (source.includes("public") || source.includes("online")) return "public";
  return "public";
}

function appointmentSourceLabel(source: string) {
  return source === "bot" ? "Bot" : source === "google" ? "Google / diğer" : "Online randevu";
}

function checkoutLineNames(checkout: Business["checkouts"][number], business: Business) {
  const lines = checkout.lines || [];
  return lines.map((line) => business.services.find((service) => service.id === String(line.serviceId || ""))?.name).filter(Boolean).join(", ") || business.services.find((service) => service.id === checkout.serviceId)?.name || "Adisyon";
}

const sourceOptions: SelectOption[] = [
  { value: "all", label: "Tüm kaynaklar" },
  { value: "checkout", label: "Adisyon" },
  { value: "public", label: "Online randevu" },
  { value: "bot", label: "Bot" },
  { value: "google", label: "Google / diğer" },
];

const statusOptions: SelectOption[] = [
  { value: "all", label: "Tüm durumlar" },
  { value: "REQUESTED", label: "Talep" },
  { value: "CONFIRMED", label: "Onaylı" },
  { value: "COMPLETED", label: "Tamamlandı" },
  { value: "CANCELED", label: "İptal" },
];

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  headerContent: { gap: spacing.lg },
  filterCard: { gap: spacing.md },
  grow: { flex: 1 },
  name: { color: colors.text, fontSize: 16, fontWeight: "800" },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  meta: { color: colors.textMuted, fontSize: 12, fontWeight: "700" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  action: { flexDirection: "row", alignItems: "center", gap: spacing.xs, borderRadius: radii.md, backgroundColor: colors.successSoft, paddingHorizontal: spacing.md, paddingVertical: 10 },
  actionDanger: { backgroundColor: colors.dangerSoft },
  actionText: { color: colors.success, fontSize: 13, fontWeight: "800" },
  actionTextDanger: { color: colors.danger },
  disabled: { opacity: 0.45 },
  modal: { flex: 1, backgroundColor: colors.background },
  modalHeader: { minHeight: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: "900" },
  close: { width: 40, height: 40, borderRadius: radii.md, backgroundColor: colors.surfaceMuted, alignItems: "center", justifyContent: "center" },
  detailContent: { padding: spacing.lg, gap: spacing.sm },
  detailRow: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  detailLabel: { width: 92, color: colors.textMuted, fontSize: 13, fontWeight: "700" },
  detailValue: { flex: 1, color: colors.text, fontSize: 14, fontWeight: "600" },
});
