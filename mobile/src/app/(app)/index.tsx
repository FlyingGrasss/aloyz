import { StyleSheet, Text, View } from "react-native";
import { CalendarCheck, MessageCircle, Users } from "lucide-react-native";
import { BusinessGate } from "@/components/BusinessGate";
import { Card, PageHeader, ScrollScreen, StatusPill, uiStyles } from "@/components/ui";
import { appointmentStatusLabel, formatDate, istanbulDate, statusTone } from "@/domain/format";
import { useBusiness } from "@/providers/BusinessProvider";
import { colors, spacing } from "@/theme/tokens";

export default function OverviewScreen() {
  return <BusinessGate><OverviewContent /></BusinessGate>;
}

function OverviewContent() {
  const { business } = useBusiness();
  if (!business) return null;
  const today = istanbulDate();
  const todayAppointments = business.appointments.filter((item) => item.date === today);
  const upcoming = business.appointments
    .filter((item) => item.date >= today && item.status !== "CANCELED")
    .sort((left, right) => `${left.date}${left.time}`.localeCompare(`${right.date}${right.time}`))
    .slice(0, 4);

  return (
    <ScrollScreen>
      <PageHeader title={`Merhaba, ${business.name}`} subtitle="İşletmenizin bugünkü görünümü" />
      <View style={styles.metrics}>
        <MetricCard icon={CalendarCheck} value={String(todayAppointments.length)} label="Bugünkü randevu" />
        <MetricCard icon={Users} value={String(business.customers.length)} label="Müşteri" />
        <MetricCard icon={MessageCircle} value={String(business.conversations.length)} label="Görüşme" />
      </View>

      <View style={uiStyles.between}>
        <Text style={uiStyles.sectionTitle}>Yaklaşan randevular</Text>
        <StatusPill label={business.is_active ? "Aktif" : "Pasif"} tone={business.is_active ? "success" : "neutral"} />
      </View>
      {upcoming.length ? upcoming.map((appointment) => (
        <Card key={appointment.id}>
          <View style={uiStyles.between}>
            <View style={styles.grow}>
              <Text style={styles.itemTitle}>{appointment.customerName}</Text>
              <Text style={uiStyles.body}>{formatDate(appointment.date)} · {appointment.time}</Text>
            </View>
            <StatusPill label={appointmentStatusLabel(appointment.status)} tone={statusTone(appointment.status)} />
          </View>
          {appointment.description ? <Text style={uiStyles.body}>{appointment.description}</Text> : null}
        </Card>
      )) : (
        <Card><Text style={uiStyles.body}>Yaklaşan randevu bulunmuyor.</Text></Card>
      )}
    </ScrollScreen>
  );
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
  metric: { flexGrow: 1, flexBasis: 96, minWidth: 96 },
  metricValue: { color: colors.text, fontSize: 26, fontWeight: "900" },
  metricLabel: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
  grow: { flex: 1 },
  itemTitle: { color: colors.text, fontSize: 16, fontWeight: "800" },
});
