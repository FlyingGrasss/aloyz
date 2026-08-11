import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CalendarCheck, MessageCircle, Users } from "lucide-react-native";
import { useRouter, type Href } from "expo-router";
import { BusinessGate } from "@/components/BusinessGate";
import { Button, Card, PageHeader, ScrollScreen, StatusPill, uiStyles } from "@/components/ui";
import type { Business, CustomerProfile } from "@/domain/models";
import { useBusiness } from "@/providers/BusinessProvider";
import { colors, spacing } from "@/theme/tokens";

type ActivityTab = "appointments" | "receivables" | "birthdays";

export default function OverviewScreen() {
  return <BusinessGate><OverviewContent /></BusinessGate>;
}

function OverviewContent() {
  const router = useRouter();
  const { business, save } = useBusiness();
  const [activeTab, setActiveTab] = useState<ActivityTab>("appointments");
  if (!business) return null;
  const currentBusiness = business;

  const appointments = business.appointments || [];
  const checkouts = business.checkouts || [];
  const receivables = (business.promotions.receivables || []).filter((item) => item.amount > item.paidAmount);
  const upcomingBirthdays = useMemo(() => getUpcomingBirthdays(business?.customers || []), [business?.customers]);
  const contactsCount = (business.customers || []).length + (business.conversations || []).length;

  async function markReceivableReminder(id: string) {
    await save({
      promotions: {
        ...currentBusiness.promotions,
        receivables: (currentBusiness.promotions.receivables || []).map((item) => item.id === id
          ? { ...item, status: "Hatırlatıldı", reminderSentAt: new Date().toISOString() }
          : item),
      },
    });
  }

  return (
    <ScrollScreen>
      <PageHeader title="Özet" subtitle={`Aloyz · ${business.name}`} />
      <View style={styles.metrics}>
        <MetricCard icon={CalendarCheck} value={String(appointments.length + checkouts.length)} label="Bugünkü randevu" />
        <MetricCard icon={Users} value={String(contactsCount)} label="Kişi sayısı" />
        <MetricCard icon={MessageCircle} value={business.instagram_page_id ? "2" : "1"} label="Mesaj kanalı" />
        <MetricCard icon={business.is_active ? MessageCircle : CalendarCheck} value={business.is_active ? "Aktif" : "Pasif"} label="Bot durumu" />
      </View>

      <Card style={styles.activityCard}>
        <View style={styles.tabs}>
          <Tab label="Açık randevular" active={activeTab === "appointments"} onPress={() => setActiveTab("appointments")} />
          <Tab label="Alacak hatırlatmaları" active={activeTab === "receivables"} onPress={() => setActiveTab("receivables")} />
          <Tab label="Yaklaşan doğum günleri" active={activeTab === "birthdays"} onPress={() => setActiveTab("birthdays")} />
        </View>
        {activeTab === "appointments" ? <AppointmentsTable appointments={appointments} checkouts={checkouts} /> : null}
        {activeTab === "receivables" ? <ReceivablesTable rows={receivables} onReminder={(id) => void markReceivableReminder(id)} /> : null}
        {activeTab === "birthdays" ? <BirthdaysTable rows={upcomingBirthdays} /> : null}
      </Card>

      <View style={styles.actionGrid}>
        <ActionPanel title="Kişiler" description="Tüm müşteri kayıtlarını telefon, kanal ve son görüşme bilgileriyle görüntüleyin." onPress={() => router.push("/(app)/customers" as Href)} />
        {business.currentMembershipRole === "owner" ? <ActionPanel title="Kurulum" description="Temel bilgiler, çalışma saatleri ve entegrasyon ayarlarını düzenleyin." onPress={() => router.push("/(app)/business/profile" as Href)} /> : null}
      </View>
    </ScrollScreen>
  );
}

function Tab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.tab, active && styles.activeTab]}><Text style={[styles.tabText, active && styles.activeTabText]}>{label}</Text></Pressable>;
}

function TableHeader({ children }: { children: string }) {
  return <Text style={styles.tableHeader}>{children}</Text>;
}

function AppointmentsTable({ appointments, checkouts }: { appointments: Business["appointments"]; checkouts: Business["checkouts"] }) {
  const rows = [
    ...appointments.slice(0, 6).map((item) => ({ id: `appointment-${item.id}`, date: `${item.date} ${item.time}`, customer: item.customerName, source: "Bot", service: item.description || "-", amount: "-", status: item.status })),
    ...checkouts.slice(0, 6).map((item) => ({ id: `checkout-${item.id}`, date: `${item.date} ${item.hour}:${item.minute}`, customer: item.customerName, source: "Adisyon", service: item.notes || "-", amount: `${item.amount} TL`, status: item.status })),
  ];
  return <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.horizontalTable}><View style={styles.table}><View style={styles.tableRow}><TableHeader>Tarih</TableHeader><TableHeader>Müşteri</TableHeader><TableHeader>Kaynak</TableHeader><TableHeader>Hizmetler</TableHeader><TableHeader>Toplam tutar</TableHeader></View>{rows.map((row) => <View key={row.id} style={styles.tableRow}><Text style={styles.cell}>{row.date}</Text><Text style={[styles.cell, styles.strongCell]}>{row.customer}</Text><Text style={styles.cellMuted}>{row.source}</Text><Text style={styles.cellMuted}>{row.service}</Text><Text style={styles.cellMuted}>{row.amount}</Text></View>)}{!rows.length ? <EmptyTable label="Henüz açık randevu yok." /> : null}</View></ScrollView>;
}

function ReceivablesTable({ rows, onReminder }: { rows: NonNullable<Business["promotions"]["receivables"]>; onReminder: (id: string) => void }) {
  return <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.horizontalTable}><View style={styles.table}><View style={styles.tableRow}><TableHeader>Tarih</TableHeader><TableHeader>Müşteri</TableHeader><TableHeader>Açıklama</TableHeader><TableHeader>Kalan</TableHeader><TableHeader>Durum</TableHeader><TableHeader>Aksiyon</TableHeader></View>{rows.map((row) => <View key={row.id} style={styles.tableRow}><Text style={styles.cell}>{row.date}</Text><Text style={[styles.cell, styles.strongCell]}>{row.personName}</Text><Text style={styles.cellMuted}>{row.description || "-"}</Text><Text style={styles.cell}>{Math.max(0, row.amount - row.paidAmount)} TL</Text><Text style={styles.cellMuted}>{row.status}</Text><View style={styles.actionCell}><Button variant="secondary" onPress={() => onReminder(row.id)}>Hatırlatıldı</Button></View></View>)}{!rows.length ? <EmptyTable label="Hatırlatılacak açık alacak yok." /> : null}</View></ScrollView>;
}

type BirthdayRow = { customer: CustomerProfile; daysLeft: number; displayDate: string };

function BirthdaysTable({ rows }: { rows: BirthdayRow[] }) {
  return <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.horizontalTable}><View style={styles.table}><View style={styles.tableRow}><TableHeader>Müşteri</TableHeader><TableHeader>Doğum günü</TableHeader><TableHeader>Kalan gün</TableHeader><TableHeader>İletişim</TableHeader></View>{rows.map((row) => <View key={row.customer.id} style={styles.tableRow}><Text style={[styles.cell, styles.strongCell]}>{row.customer.name}</Text><Text style={styles.cell}>{row.displayDate}</Text><Text style={styles.cell}>{row.daysLeft}</Text><Text style={styles.cellMuted}>{row.customer.phone || row.customer.email || "-"}</Text></View>)}{!rows.length ? <EmptyTable label="Önümüzdeki 30 gün içinde doğum günü yok." /> : null}</View></ScrollView>;
}

function EmptyTable({ label }: { label: string }) {
  return <View style={styles.emptyTable}><Text style={uiStyles.body}>{label}</Text></View>;
}

function ActionPanel({ title, description, onPress }: { title: string; description: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.actionPanel, pressed && styles.actionPanelPressed]}><Text style={styles.actionTitle}>{title}</Text><Text style={uiStyles.body}>{description}</Text><Text style={styles.actionLink}>Aç <Text style={styles.actionArrow}>→</Text></Text></Pressable>;
}

function MetricCard({ icon: Icon, value, label }: { icon: typeof CalendarCheck; value: string; label: string }) {
  return <Card style={styles.metric}><Icon size={19} color={colors.brand} /><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></Card>;
}

function getUpcomingBirthdays(customers: CustomerProfile[]): BirthdayRow[] {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return customers.map((customer) => {
    if (!customer.birthDate) return null;
    const source = new Date(`${customer.birthDate}T12:00:00`);
    if (Number.isNaN(source.getTime())) return null;
    let next = new Date(start.getFullYear(), source.getMonth(), source.getDate());
    if (next < start) next = new Date(start.getFullYear() + 1, source.getMonth(), source.getDate());
    const daysLeft = Math.round((next.getTime() - start.getTime()) / 86_400_000);
    if (daysLeft > 30) return null;
    return { customer, daysLeft, displayDate: next.toLocaleDateString("tr-TR", { day: "numeric", month: "long" }) };
  }).filter((value): value is BirthdayRow => Boolean(value)).sort((a, b) => a.daysLeft - b.daysLeft);
}

const styles = StyleSheet.create({
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  metric: { flexGrow: 1, flexBasis: 132, minWidth: 132 },
  metricValue: { color: colors.text, fontSize: 24, fontWeight: "800" },
  metricLabel: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  activityCard: { padding: spacing.md },
  tabs: { flexDirection: "row", flexWrap: "wrap", borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.xs },
  tab: { paddingHorizontal: spacing.sm, paddingVertical: spacing.md, borderBottomWidth: 2, borderBottomColor: "transparent" },
  activeTab: { borderBottomColor: colors.border, borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  tabText: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  activeTabText: { color: colors.text, fontWeight: "700" },
  horizontalTable: { minWidth: "100%" },
  table: { minWidth: 680, paddingTop: spacing.md },
  tableRow: { minHeight: 52, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: colors.border },
  tableHeader: { width: 132, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, color: colors.text, fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  cell: { width: 132, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, color: colors.text, fontSize: 13 },
  strongCell: { fontWeight: "700" },
  cellMuted: { width: 132, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, color: colors.textMuted, fontSize: 13 },
  actionCell: { width: 132, paddingHorizontal: spacing.sm },
  emptyTable: { minHeight: 120, alignItems: "center", justifyContent: "center", gap: spacing.xs },
  actionGrid: { gap: spacing.md },
  actionPanel: { borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg, gap: spacing.sm, shadowColor: "#0F172A", shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  actionPanelPressed: { backgroundColor: colors.surfaceMuted },
  actionTitle: { color: colors.text, fontSize: 17, fontWeight: "800" },
  actionLink: { color: colors.primary, fontSize: 13, fontWeight: "700" },
  actionArrow: { fontSize: 16 },
});
