import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { CalendarCheck, MessageCircle, Users } from "lucide-react-native";
import { BusinessGate } from "@/components/BusinessGate";
import { Card, PageHeader, ScrollScreen, StatusPill, uiStyles } from "@/components/ui";
import { appointmentStatusLabel, formatDate, istanbulDate, statusTone } from "@/domain/format";
import type { Appointment, Business } from "@/domain/models";
import { useBusiness } from "@/providers/BusinessProvider";
import { colors, spacing } from "@/theme/tokens";

export default function OverviewScreen() {
  return <BusinessGate><OverviewContent /></BusinessGate>;
}

function OverviewContent() {
  const { business } = useBusiness();
  const [activeTab, setActiveTab] = useState<"appointments" | "receivables" | "birthdays">("appointments");
  if (!business) return null;
  const today = istanbulDate();
  const todayAppointments = business.appointments.filter((item) => item.date === today);
  const todayCheckouts = business.checkouts.filter((item) => item.createdAt.slice(0, 10) === today);
  const upcoming = business.appointments
    .filter((item) => item.date >= today && item.status !== "CANCELED")
    .sort((left, right) => `${left.date}${left.time}`.localeCompare(`${right.date}${right.time}`))
    .slice(0, 4);

  return (
    <ScrollScreen>
      <PageHeader title={`Merhaba, ${business.name}`} subtitle="İşletmenizin bugünkü görünümü" />
      <View style={styles.metrics}>
        <MetricCard icon={CalendarCheck} value={String(todayAppointments.length + todayCheckouts.length)} label="Bugünkü randevu" />
        <MetricCard icon={Users} value={String(business.customers.length + business.conversations.length)} label="Kişi sayısı" />
        <MetricCard icon={MessageCircle} value={business.instagram_page_id ? "2" : "1"} label="Mesaj kanalı" />
        <MetricCard icon={business.is_active ? MessageCircle : CalendarCheck} value={business.is_active ? "Aktif" : "Pasif"} label="Bot durumu" />
      </View>

      <Card style={styles.activityCard}>
        <Text style={uiStyles.sectionTitle}>İşletme görünümü</Text>
        <View style={styles.tabs}>
          <Tab label="Açık randevular" active={activeTab === "appointments"} onPress={() => setActiveTab("appointments")} />
          <Tab label="Alacak hatırlatmaları" active={activeTab === "receivables"} onPress={() => setActiveTab("receivables")} />
          <Tab label="Yaklaşan doğum günleri" active={activeTab === "birthdays"} onPress={() => setActiveTab("birthdays")} />
        </View>
        {activeTab === "appointments" ? (
          upcoming.length ? upcoming.map((appointment) => <AppointmentRow key={appointment.id} appointment={appointment} />) : <EmptyRow label="Yaklaşan randevu bulunmuyor." />
        ) : activeTab === "receivables" ? (
          <ReceivableRows business={business} />
        ) : (
          <BirthdayRows business={business} />
        )}
      </Card>
    </ScrollScreen>
  );
}

function Tab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.tab, active && styles.activeTab]}><Text style={[styles.tabText, active && styles.activeTabText]}>{label}</Text></Pressable>;
}

function AppointmentRow({ appointment }: { appointment: Appointment }) {
  return <View style={styles.tableRow}><View style={styles.grow}><Text style={styles.itemTitle}>{appointment.customerName}</Text><Text style={uiStyles.body}>{formatDate(appointment.date)} · {appointment.time}</Text></View><StatusPill label={appointmentStatusLabel(appointment.status)} tone={statusTone(appointment.status)} /></View>;
}

function ReceivableRows({ business }: { business: Business }) {
  const rows = [...(business.promotions.receivables || []), ...(business.promotions.debts || [])].filter((item) => item.amount > item.paidAmount).slice(0, 4);
  return rows.length ? <>{rows.map((row) => <View style={styles.tableRow} key={row.id}><View style={styles.grow}><Text style={styles.itemTitle}>{row.personName}</Text><Text style={uiStyles.body}>{row.description || "Alacak"}</Text></View><StatusPill label={`${(row.amount - row.paidAmount).toLocaleString("tr-TR")} ₺`} tone="warning" /></View>)}</> : <EmptyRow label="Bekleyen alacak bulunmuyor." />;
}

function BirthdayRows({ business }: { business: Business }) {
  const today = istanbulDate().slice(5);
  const rows = business.customers.filter((customer) => customer.birthDate?.slice(5) >= today).slice(0, 4);
  return rows.length ? <>{rows.map((row) => <View style={styles.tableRow} key={row.id}><View style={styles.grow}><Text style={styles.itemTitle}>{row.name}</Text><Text style={uiStyles.body}>{row.birthDate}</Text></View><StatusPill label="Yaklaşıyor" tone="neutral" /></View>)}</> : <EmptyRow label="Yaklaşan doğum günü bulunmuyor." />;
}

function EmptyRow({ label }: { label: string }) {
  return <View style={styles.emptyRow}><Text style={uiStyles.body}>{label}</Text></View>;
}

function MetricCard({ icon: Icon, value, label }: { icon: typeof CalendarCheck; value: string; label: string }) {
  return (
    <Card style={styles.metric}>
      <Icon size={21} color={colors.primary} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  metric: { flexGrow: 1, flexBasis: 132, minWidth: 132 },
  metricValue: { color: colors.text, fontSize: 24, fontWeight: "800" },
  metricLabel: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  activityCard: { padding: spacing.md },
  tabs: { flexDirection: "row", flexWrap: "wrap", borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.xs },
  tab: { paddingHorizontal: spacing.sm, paddingVertical: spacing.md, borderBottomWidth: 2, borderBottomColor: "transparent" },
  activeTab: { borderBottomColor: colors.primary },
  tabText: { color: colors.textMuted, fontSize: 12, fontWeight: "700" },
  activeTabText: { color: colors.primary },
  tableRow: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  emptyRow: { paddingVertical: spacing.xl },
  grow: { flex: 1 },
  itemTitle: { color: colors.text, fontSize: 16, fontWeight: "800" },
});
