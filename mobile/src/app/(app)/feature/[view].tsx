import { useMemo, useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { Redirect, useLocalSearchParams, useRouter, type Href } from "expo-router";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { BusinessGate } from "@/components/BusinessGate";
import { EntityManager, type EntityField } from "@/components/EntityManager";
import { CheckoutManager, SalesManager } from "@/components/OperationalManagers";
import { Button, Card, Field, MessageState, PageHeader, ScrollScreen, StatusPill, uiStyles } from "@/components/ui";
import { SelectField } from "@/components/SelectField";
import { decodeFeatureId, featureLabel, type DashboardFeatureId } from "@/domain/dashboardNavigation";
import type { Business, Conversation } from "@/domain/models";
import { useBusiness } from "@/providers/BusinessProvider";
import { apiClient } from "@/services/apiClient";
import { shareCsv } from "@/services/exportService";
import { colors, radii, spacing } from "@/theme/tokens";

WebBrowser.maybeCompleteAuthSession();

export default function DashboardFeatureScreen() {
  const params = useLocalSearchParams<{ view?: string | string[] }>();
  const encoded = Array.isArray(params.view) ? params.view[0] || "" : params.view || "";
  const view = decodeFeatureId(encoded);
  if (!view) return <MessageState title="Sayfa bulunamadı" message="Bu dashboard özelliği tanınmıyor." />;
  if (view === "booking/list") return <Redirect href="/(app)/appointments" />;
  if (view === "client/list") return <Redirect href="/(app)/customers" />;
  if (view === "setup/general") return <Redirect href="/business/profile" />;
  if (view === "setup/working-hours") return <Redirect href="/business/hours" />;
  return <BusinessGate><FeatureContent view={view} /></BusinessGate>;
}

function FeatureContent({ view }: { view: DashboardFeatureId }) {
  const { business } = useBusiness();
  if (!business) return null;
  if (view === "calendar") return <CalendarFeature business={business} />;
  if (view.startsWith("messaging/")) return <MessagingFeature view={view} business={business} />;
  if (view.startsWith("report/")) return <ReportFeature view={view} business={business} />;
  if (view === "subscription" || view === "invoice/list") return <AccountFeature view={view} business={business} />;
  if (view.startsWith("setup/")) return <SetupFeature view={view} business={business} />;
  return <RecordFeature view={view} business={business} />;
}

function CalendarFeature({ business }: { business: Business }) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(today());
  const [selectedStaffId, setSelectedStaffId] = useState("all");
  const appointments = business.appointments
    .filter((item) => item.date === selectedDate && (selectedStaffId === "all" || item.staffId === selectedStaffId))
    .sort((a, b) => a.time.localeCompare(b.time));
  const checkouts = business.checkouts
    .filter((item) => item.date === selectedDate && (selectedStaffId === "all" || item.staffId === selectedStaffId || item.lines?.some((line) => String(line.staffId || "") === selectedStaffId)))
    .sort((a, b) => `${a.hour}:${a.minute}`.localeCompare(`${b.hour}:${b.minute}`));
  const slots = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, "0"));

  return (
    <ScrollScreen>
      <PageHeader title="Randevu takvimi" subtitle={business.calendarId ? "Google Takvim bağlı" : "Yerel dashboard kayıtları"} />
      <Card>
        <SelectField label="Personel" value={selectedStaffId} options={[{ value: "all", label: "Tüm personel" }, ...business.staff.map((staff) => ({ value: staff.id, label: staff.name }))]} onChange={setSelectedStaffId} />
        <Field label="Görüntülenecek tarih" value={selectedDate} onChangeText={setSelectedDate} placeholder="YYYY-AA-GG" />
        <View style={styles.dateActions}>
          <Button variant="secondary" onPress={() => setSelectedDate(offsetDate(selectedDate, -1))}>‹</Button>
          <Button variant="secondary" onPress={() => setSelectedDate(today())}>Bugün</Button>
          <Button variant="secondary" onPress={() => setSelectedDate(offsetDate(selectedDate, 1))}>›</Button>
          <Button onPress={() => router.push("/feature/visit--list?create=1" as Href)}>Yeni adisyon</Button>
        </View>
      </Card>
      <Card style={styles.calendarCard}>
        <Text style={styles.calendarDate}>{new Date(`${selectedDate}T12:00:00`).toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })}</Text>
        {slots.map((hour) => {
          const hourAppointments = appointments.filter((item) => item.time.startsWith(`${hour}:`));
          const hourCheckouts = checkouts.filter((item) => item.hour === hour);
          return <View key={hour} style={styles.calendarRow}><Text style={styles.calendarHour}>{hour}:00</Text><View style={styles.calendarCell}>{hourAppointments.map((item) => <Pressable key={item.id} onPress={() => router.push("/(app)/appointments" as Href)} style={[styles.calendarEvent, styles.appointmentEvent]}><Text style={styles.calendarEventTitle}>{item.time} · {item.customerName}</Text><Text style={styles.calendarEventBody}>{item.description || item.status}</Text></Pressable>)}{hourCheckouts.map((item) => <Pressable key={item.id} onPress={() => router.push("/feature/visit--list" as Href)} style={[styles.calendarEvent, styles.checkoutEvent]}><Text style={styles.calendarEventTitle}>{item.hour}:{item.minute} · {item.customerName}</Text><Text style={styles.calendarEventBody}>{checkoutLineNames(item, business)}</Text></Pressable>)}{!hourAppointments.length && !hourCheckouts.length ? <View style={styles.emptySlot} /> : null}</View></View>;
        })}
        {!appointments.length && !checkouts.length ? <Text style={uiStyles.body}>Bu tarihte randevu veya adisyon yok.</Text> : null}
      </Card>
    </ScrollScreen>
  );
}

function MessagingFeature({ view, business }: { view: DashboardFeatureId; business: Business }) {
  const [selected, setSelected] = useState<Conversation | null>(null);
  const channel = view.includes("instagram") ? "instagram" : view.endsWith("sent-reminders") ? null : "whatsapp";
  const setup = view.endsWith("/setup") || view.endsWith("/register");
  const conversations = business.conversations.filter((item) => !channel || item.channel === channel);
  if (view === "messaging/whatsapp/sent-reminders") return <AutomaticMessagesFeature business={business} />;
  if (setup) return <ConnectionFeature view={view} business={business} />;
  if (selected) return <ConversationDetail conversation={selected} onBack={() => setSelected(null)} />;
  return (
    <ScrollScreen>
      <PageHeader title={featureLabel(view)} subtitle={`${conversations.length} görüşme`} />
      {conversations.map((conversation) => <ConversationCard key={conversation.id} conversation={conversation} onPress={() => setSelected(conversation)} />)}
      {!conversations.length ? <Card><Text style={uiStyles.body}>Bu kanalda henüz mesaj bulunmuyor.</Text></Card> : null}
    </ScrollScreen>
  );
}

type MessageRow = {
  id: string;
  customer: string;
  channel: string;
  phone: string;
  status: "Gönderildi" | "Okundu";
  date: string;
  sentAt: string;
};

function AutomaticMessagesFeature({ business }: { business: Business }) {
  const router = useRouter();
  const [customerQuery, setCustomerQuery] = useState("");
  const [period, setPeriod] = useState("Tümü");
  const [status, setStatus] = useState("Tümü");
  const [latestFirst, setLatestFirst] = useState(true);
  const rows = useMemo<MessageRow[]>(() => business.conversations.flatMap((conversation) => {
    const messages = Array.isArray(conversation.messages) ? conversation.messages : [];
    const customer = conversation.customerName || conversation.instagramUsername || conversation.customerPhone || conversation.customerJid;
    return messages.map((raw, index) => {
      const message = raw && typeof raw === "object" ? raw as Record<string, unknown> : { text: String(raw || "") };
      const updatedAt = conversation.updatedAt || conversation.createdAt || new Date().toISOString();
      const role = String(message.role || message.sender || "assistant");
      return {
        id: `${conversation.id}-${index}`,
        customer,
        channel: conversation.channel === "instagram" ? "Instagram" : "WhatsApp",
        phone: conversation.customerPhone || "-",
        status: role === "model" || role === "assistant" ? "Gönderildi" : "Okundu",
        date: updatedAt.slice(0, 10),
        sentAt: updatedAt,
      };
    });
  }), [business.conversations]);
  const filteredRows = useMemo(() => {
    const query = customerQuery.trim().toLocaleLowerCase("tr-TR");
    return rows
      .filter((row) => !query || row.customer.toLocaleLowerCase("tr-TR").startsWith(query))
      .filter((row) => period === "Tümü" || isMessageInPeriod(row.date, period))
      .filter((row) => status === "Tümü" || row.status === status)
      .sort((left, right) => {
        const difference = new Date(right.sentAt).getTime() - new Date(left.sentAt).getTime();
        return latestFirst ? difference : -difference;
      });
  }, [customerQuery, latestFirst, period, rows, status]);
  const counts = useMemo(() => ({
    Tümü: rows.length,
    Gönderildi: rows.filter((row) => row.status === "Gönderildi").length,
    Okundu: rows.filter((row) => row.status === "Okundu").length,
  }), [rows]);

  return (
    <ScrollScreen>
      <PageHeader title="Tüm Mesajlar" subtitle={`${filteredRows.length} mesaj`} />
      <Card>
        <Field label="Müşteri" value={customerQuery} onChangeText={setCustomerQuery} placeholder="Tümü" />
        <SelectField label="Sıralama" value={latestFirst ? "latest" : "oldest"} options={[{ value: "latest", label: "En yeni önce" }, { value: "oldest", label: "En eski önce" }]} onChange={(value) => setLatestFirst(value === "latest")} />
        <SelectField label="Tarih aralığı" value={period} options={[{ value: "Bu ay", label: "Bu ay" }, { value: "Bugün", label: "Bugün" }, { value: "Tümü", label: "Tümü" }]} onChange={setPeriod} />
        <View style={styles.statusFilters}>
          {(["Tümü", "Gönderildi", "Okundu"] as const).map((label) => <Pressable key={label} onPress={() => setStatus(label)} style={[styles.statusFilter, status === label && styles.statusFilterActive]}><Text style={[styles.statusFilterText, status === label && styles.statusFilterTextActive]}>{label} {counts[label]}</Text></Pressable>)}
        </View>
        <Button variant="secondary" onPress={() => router.push("/feature/setup--salon-bot-settings" as Href)}>Bot ayarlarına git</Button>
      </Card>
      {filteredRows.map((row) => <Card key={row.id}><View style={uiStyles.between}><Text style={styles.itemTitle}>{row.customer}</Text><StatusPill label={row.channel} /></View><Text style={uiStyles.body}>{row.phone} · {row.date}</Text><Text style={uiStyles.body}>{row.status} · {row.sentAt === "-" ? "-" : new Date(row.sentAt).toLocaleString("tr-TR")}</Text></Card>)}
      {!filteredRows.length ? <Card><Text style={uiStyles.body}>Bu filtrelerle eşleşen mesaj bulunmuyor.</Text></Card> : null}
    </ScrollScreen>
  );
}

function ConversationCard({ conversation, onPress }: { conversation: Conversation; onPress: () => void }) {
  const messages = Array.isArray(conversation.messages) ? conversation.messages : [];
  const last = messages.at(-1);
  const lastText = typeof last === "string" ? last : last && typeof last === "object" ? String((last as Record<string, unknown>).text || (last as Record<string, unknown>).body || "") : "";
  return (
    <Card>
      <View style={uiStyles.between}>
        <Text style={styles.itemTitle}>{conversation.customerName || conversation.instagramUsername || conversation.customerPhone || conversation.customerJid}</Text>
        <StatusPill label={conversation.channel === "instagram" ? "Instagram" : "WhatsApp"} />
      </View>
      <Text style={uiStyles.body} numberOfLines={3}>{lastText || `${messages.length} mesaj`}</Text>
      <Button variant="secondary" onPress={onPress}>Görüşmeyi aç</Button>
    </Card>
  );
}

function ConversationDetail({ conversation, onBack }: { conversation: Conversation; onBack: () => void }) {
  const messages = Array.isArray(conversation.messages) ? conversation.messages : [];
  return (
    <ScrollScreen>
      <PageHeader title={conversation.customerName || conversation.instagramUsername || conversation.customerPhone || "Görüşme"} subtitle={conversation.channel === "instagram" ? "Instagram" : "WhatsApp"} />
      <Button variant="secondary" onPress={onBack}>Görüşmelere dön</Button>
      {messages.map((raw, index) => {
        const message = raw && typeof raw === "object" ? raw as Record<string, unknown> : { text: String(raw || "") };
        const role = String(message.role || message.sender || "assistant");
        const customer = role === "user" || role === "customer" || role === "incoming";
        const body = String(message.text || message.body || message.content || "");
        return (
          <View key={`${index}-${body.slice(0, 12)}`} style={[styles.messageBubble, customer ? styles.customerMessage : styles.assistantMessage]}>
            <Text style={styles.messageRole}>{customer ? "Müşteri" : "Aloyz"}</Text>
            <Text style={styles.messageText}>{body || "Desteklenmeyen mesaj içeriği"}</Text>
          </View>
        );
      })}
      {!messages.length ? <Card><Text style={uiStyles.body}>Bu görüşmede mesaj bulunmuyor.</Text></Card> : null}
    </ScrollScreen>
  );
}

function ConnectionFeature({ view, business }: { view: DashboardFeatureId; business: Business }) {
  const { refresh } = useBusiness();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const instagram = view.includes("instagram");
  const connected = instagram
    ? Boolean(business.instagram_page_id || business.botSettings.instagramConnected)
    : Boolean(business.is_active || business.botSettings.whatsappConnected);

  async function disconnect() {
    try {
      if (instagram) await apiClient.post("/api/integrations/instagram/disconnect");
      else await apiClient.delete(`/api/instances/delete?slug=${encodeURIComponent(business.slug)}`);
      await refresh();
    } catch (caught) {
      Alert.alert("Bağlantı güncellenemedi", caught instanceof Error ? caught.message : "Lütfen yeniden deneyin.");
    }
  }

  async function prepareWhatsapp() {
    setConnecting(true);
    try {
      await apiClient.post("/api/instances/create", { slug: business.slug, businessId: business.id });
      const result = await apiClient.get<{ qrBase64: string | null }>(`/api/instances/qr?slug=${encodeURIComponent(business.slug)}`);
      if (result.qrBase64) setQrCode(result.qrBase64.startsWith("data:image") ? result.qrBase64 : `data:image/png;base64,${result.qrBase64}`);
      else Alert.alert("QR kod alınamadı", "Bağlantı servisi henüz QR kod üretmedi. Birkaç saniye sonra yeniden deneyin.");
    } catch (caught) {
      Alert.alert("WhatsApp hazırlanamadı", caught instanceof Error ? caught.message : "Lütfen yeniden deneyin.");
    } finally {
      setConnecting(false);
    }
  }

  async function connectInstagram() {
    setConnecting(true);
    try {
      const returnUrl = Linking.createURL("instagram");
      const response = await apiClient.get<{ url: string; returnUrl: string }>(`/api/mobile/integrations/instagram/connect?returnUrl=${encodeURIComponent(returnUrl)}`);
      const result = await WebBrowser.openAuthSessionAsync(response.url, response.returnUrl);
      if (result.type === "success") {
        const status = Linking.parse(result.url).queryParams?.instagram;
        if (status === "connected") await refresh();
        else if (status === "failed") Alert.alert("Instagram bağlanamadı", "Instagram yetkilendirmesi tamamlanamadı.");
      }
    } catch (caught) {
      Alert.alert("Instagram bağlanamadı", caught instanceof Error ? caught.message : "Lütfen yeniden deneyin.");
    } finally {
      setConnecting(false);
    }
  }

  return (
    <ScrollScreen>
      <PageHeader title={featureLabel(view)} subtitle="Bağlantı durumu web dashboard ile ortaktır." />
      <Card>
        <View style={uiStyles.between}>
          <Text style={styles.itemTitle}>{instagram ? "Instagram" : "WhatsApp"}</Text>
          <StatusPill label={connected ? "Bağlı" : "Bağlı değil"} tone={connected ? "success" : "warning"} />
        </View>
        {instagram && business.botSettings.instagramProfilePicture ? (
          <Image source={{ uri: String(business.botSettings.instagramProfilePicture) }} style={styles.profileImage} />
        ) : null}
        {qrCode ? <Image source={{ uri: qrCode }} style={styles.qrImage} resizeMode="contain" /> : null}
        {qrCode ? <Text style={uiStyles.body}>WhatsApp uygulamasında Bağlı cihazlar bölümünden bu QR kodu okutun.</Text> : null}
        {connected ? <Button variant="danger" onPress={() => void disconnect()}>Bağlantıyı kaldır</Button> : !instagram ? <Button loading={connecting} onPress={() => void prepareWhatsapp()}>WhatsApp QR kodu oluştur</Button> : <Button loading={connecting} onPress={() => void connectInstagram()}>Instagram ile bağlan</Button>}
        {!connected && qrCode ? <Button variant="secondary" onPress={() => void refresh()}>Bağlantıyı kontrol et</Button> : null}
      </Card>
    </ScrollScreen>
  );
}

function ReportFeature({ view, business }: { view: DashboardFeatureId; business: Business }) {
  const [period, setPeriod] = useState("Bu ay");
  const [sortDesc, setSortDesc] = useState(true);
  const { from, to } = reportBounds(period);
  const checkouts = business.checkouts.filter((item) => withinPeriod(item.date, from, to));
  const productSales = nestedRows(business, "productSales").filter((item) => withinPeriod(String(item.date || ""), from, to));
  const packageSales = nestedRows(business, "packageSales").filter((item) => withinPeriod(String(item.date || ""), from, to));
  const expenses = nestedRows(business, "expenses").filter((item) => withinPeriod(String(item.date || ""), from, to));
  const payments = nestedRows(business, "payments").filter((item) => withinPeriod(String(item.date || ""), from, to));
  const receivables = nestedRows(business, "receivables");
  const debts = nestedRows(business, "debts");
  const commissions = nestedRows(business, "commissions").filter((item) => withinPeriod(String(item.date || ""), from, to));
  const checkoutTotal = checkouts.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const expenseTotal = sumRecords(expenses, "amount");
  const productTotal = sumRecords(productSales, "total");
  const packageTotal = sumRecords(packageSales, "total");
  const paymentTotal = sumRecords(payments, "amount");
  const receivableRemaining = receivables.reduce((sum, item) => sum + Math.max(0, Number(item.amount || 0) - Number(item.paidAmount || 0)), 0);
  const debtRemaining = debts.reduce((sum, item) => sum + Math.max(0, Number(item.amount || 0) - Number(item.paidAmount || 0)), 0);
  const staffRows = business.staff.map((staff) => {
    const staffCheckouts = checkouts.filter((item) => item.staffId === staff.id || item.lines?.some((line) => String(line.staffId || "") === staff.id));
    const serviceTotal = staffCheckouts.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const commission = commissions.filter((item) => String(item.staffId || "") === staff.id).reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const latestActivity = [...staffCheckouts.map((item) => item.date), ...commissions.filter((item) => String(item.staffId || "") === staff.id).map((item) => String(item.date || ""))].filter(Boolean).sort().at(-1) || "-";
    return { staff, serviceCount: staffCheckouts.length, serviceTotal, commission, net: serviceTotal - commission, latestActivity };
  }).sort((left, right) => sortDesc ? right.latestActivity.localeCompare(left.latestActivity) : left.latestActivity.localeCompare(right.latestActivity));

  async function exportReport() {
    const rows = view === "report/staff"
      ? [["Personel", "Hizmet", "Hizmet tutarı", "Komisyon", "Net", "Son işlem"], ...staffRows.map((row) => [row.staff.name, String(row.serviceCount), String(row.serviceTotal), String(row.commission), String(row.net), row.latestActivity])]
      : view === "report/sales"
        ? [["Kalem", "Tutar"], ["Ürün satışları", String(productTotal)], ["Paket satışları", String(packageTotal)], ["Hizmet toplamı", String(checkoutTotal)]]
        : [["Kalem", "Tutar"], ["Hizmet toplamı", String(checkoutTotal)], ["Ürün satışları", String(productTotal)], ["Paket satışları", String(packageTotal)], ["Tahsilatlar", String(paymentTotal)], ["Masraflar", String(expenseTotal)], ["Net kasa", String(paymentTotal - expenseTotal)]];
    try {
      await shareCsv(`aloyz-${view.replace("/", "-")}-${period}.csv`, rows);
    } catch (caught) {
      Alert.alert("Rapor paylaşılamadı", caught instanceof Error ? caught.message : "Lütfen yeniden deneyin.");
    }
  }

  return (
    <ScrollScreen>
      <PageHeader title={featureLabel(view)} subtitle={`${period} dönemindeki işletme verileri`} />
      <Card>
        <SelectField label="Dönem" value={period} options={[{ value: "Bu ay", label: "Bu ay" }, { value: "Bugün", label: "Bugün" }, { value: "Tümü", label: "Tümü" }]} onChange={setPeriod} />
        <View style={styles.reportActions}>
          {view !== "report/staff" ? <Button variant="secondary" onPress={() => setSortDesc((value) => !value)}>{sortDesc ? "Yeni → Eski" : "Eski → Yeni"}</Button> : null}
          <Button variant="secondary" onPress={() => void exportReport()}>İndir</Button>
        </View>
      </Card>
      {view === "report/staff" ? staffRows.map((row) => <Card key={row.staff.id}><Text style={styles.itemTitle}>{row.staff.name}</Text><Text style={uiStyles.body}>{row.serviceCount} hizmet · {money(row.serviceTotal)}</Text><Text style={uiStyles.body}>Komisyon: {money(row.commission)} · Net: {money(row.net)}</Text><Text style={uiStyles.body}>Son işlem: {row.latestActivity}</Text></Card>) : view === "report/sales" ? (
        <View style={styles.metricGrid}><Metric label="Ürün satışları" value={money(productTotal)} /><Metric label="Paket satışları" value={money(packageTotal)} /><Metric label="Hizmet toplamı" value={money(checkoutTotal)} /></View>
      ) : (
        <View style={styles.metricGrid}>
          <Metric label="Hizmet toplamı" value={money(checkoutTotal)} />
          <Metric label="Ürün satışları" value={money(productTotal)} />
          <Metric label="Paket satışları" value={money(packageTotal)} />
          <Metric label="Tahsilatlar" value={money(paymentTotal)} />
          <Metric label="Masraflar" value={money(expenseTotal)} />
          <Metric label="Alacaklar" value={money(receivableRemaining)} />
          <Metric label="Borçlar" value={money(debtRemaining)} />
          <Metric label="Net kasa" value={money(paymentTotal - expenseTotal)} />
        </View>
      )}
    </ScrollScreen>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <Card style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={uiStyles.body}>{label}</Text></Card>;
}

function AccountFeature({ view, business }: { view: DashboardFeatureId; business: Business }) {
  const created = business.createdAt ? new Date(business.createdAt) : new Date();
  const safeCreated = Number.isNaN(created.getTime()) ? new Date() : created;
  const trialEndsAt = new Date(safeCreated);
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);
  const explicitAccess = typeof business.botSettings.hasAccessTill === "string" ? new Date(business.botSettings.hasAccessTill) : null;
  const accessTill = explicitAccess && !Number.isNaN(explicitAccess.getTime()) ? explicitAccess : trialEndsAt;
  const active = accessTill.getTime() >= Date.now();
  const trialActive = Date.now() <= trialEndsAt.getTime();
  const invoice = trialActive && active
    ? { date: safeCreated, description: "14 günlük ücretsiz deneme", amount: 0, status: "Aktif" }
    : { date: accessTill, description: "Aloyz aylık abonelik", amount: 500, status: active ? "Aktif" : "Ödeme bekleniyor" };

  async function exportInvoice() {
    try {
      await shareCsv(`aloyz-fatura-${today()}.csv`, [["Fatura tarihi", "Açıklama", "Tutar", "Durum"], [invoice.date.toLocaleDateString("tr-TR"), invoice.description, String(invoice.amount), invoice.status]]);
    } catch (caught) {
      Alert.alert("Fatura paylaşılamadı", caught instanceof Error ? caught.message : "Lütfen yeniden deneyin.");
    }
  }

  return (
    <ScrollScreen>
      <PageHeader title={featureLabel(view)} />
      {view === "subscription" ? (
        <Card>
          <StatusPill label={active ? "Aktif" : "Ödeme bekleniyor"} tone={active ? "success" : "danger"} />
          <Text style={styles.itemTitle}>Aloyz · ₺500 / ay</Text>
          <Text style={uiStyles.body}>{trialActive ? "14 günlük deneme süreniz devam ediyor." : "Aylık üyelik"}</Text>
          <Text style={uiStyles.body}>Erişim bitişi: {accessTill.toLocaleDateString("tr-TR")}</Text>
          {!active ? <Text style={uiStyles.body}>Ödeme açıklamasına hesap e-postanızı yazarak üyeliğinizi yenileyebilirsiniz.</Text> : null}
        </Card>
      ) : (
        <>
          <Card>
            <Text style={styles.itemTitle}>{invoice.description}</Text>
            <Text style={uiStyles.body}>{invoice.date.toLocaleDateString("tr-TR")} · {money(invoice.amount)}</Text>
            <StatusPill label={invoice.status} tone={active ? "success" : "warning"} />
          </Card>
          <Button variant="secondary" onPress={() => void exportInvoice()}>Faturayı CSV olarak paylaş</Button>
        </>
      )}
    </ScrollScreen>
  );
}

function SetupFeature({ view, business }: { view: DashboardFeatureId; business: Business }) {
  const { save } = useBusiness();
  const rows = setupRows(view, business);
  const isBot = view === "setup/salon-bot-settings";

  async function toggleBot(key: "instagram" | "whatsapp", value: boolean) {
    try {
      await save({ botSettings: { ...business.botSettings, [key]: value } });
    } catch (caught) {
      Alert.alert("Kaydedilemedi", caught instanceof Error ? caught.message : "Lütfen yeniden deneyin.");
    }
  }

  if (view === "setup/connections") {
    return (
      <ScrollScreen>
        <PageHeader title={featureLabel(view)} />
        <ConnectionSummary label="WhatsApp" connected={Boolean(business.is_active)} />
        <ConnectionSummary label="Instagram" connected={Boolean(business.instagram_page_id)} />
        <ConnectionSummary label="Google Takvim" connected={Boolean(business.calendarId)} />
      </ScrollScreen>
    );
  }

  if (view === "setup/booking_settings") return <BookingSettingsFeature business={business} />;

  const config = setupManagerConfig(view, business);

  async function saveRows(next: ManagedRecord[]) {
    if (["setup/staff"].includes(view)) {
      await save({ staff: next as unknown as Business["staff"] });
      return;
    }
    if (["setup/services", "setup/service_durations", "setup/service_prices"].includes(view)) {
      await save({ services: next as unknown as Business["services"] });
      return;
    }
    if (config?.promotionField) {
      await save({ promotions: { ...business.promotions, [config.promotionField]: next } });
    }
  }

  return (
    <ScrollScreen>
      <PageHeader title={featureLabel(view)} subtitle={`${rows.length} kayıt`} />
      {view.startsWith("other/") ? <FinanceSummary view={view} business={business} /> : null}
      {isBot ? (
        <Card>
          <Toggle label="WhatsApp otomasyonu" value={Boolean(business.botSettings.whatsapp)} onChange={(value) => void toggleBot("whatsapp", value)} />
          <Toggle label="Instagram otomasyonu" value={Boolean(business.botSettings.instagram)} onChange={(value) => void toggleBot("instagram", value)} />
        </Card>
      ) : null}
      {!isBot && config ? (
        <EntityManager
          records={rows as ManagedRecord[]}
          fields={config.fields}
          createLabel={config.createLabel}
          {...(config.defaults ? { createDefaults: config.defaults } : {})}
          getTitle={(row) => String(row.name || row.title || row.date || "Kayıt")}
          getSubtitle={(row) => config.subtitle(row)}
          onChange={saveRows}
        />
      ) : null}
    </ScrollScreen>
  );
}

function FinanceSummary({ view, business }: { view: DashboardFeatureId; business: Business }) {
  const rows = recordRows(view, business);
  const amount = rows.reduce((sum, row) => sum + Number(row.amount || row.total || 0), 0);
  const remaining = rows.reduce((sum, row) => sum + Math.max(0, Number(row.amount || row.total || 0) - Number(row.paidAmount || 0)), 0);
  const label = view.includes("receivable") ? "Açık alacak" : view.includes("debt") ? "Açık borç" : view.includes("expense") ? "Toplam masraf" : view.includes("commission") ? "Toplam komisyon" : "Toplam tahsilat";
  return <View style={styles.financeSummary}><Metric label={label} value={money(view.includes("receivable") || view.includes("debt") ? remaining : amount)} /><Metric label="Kayıt" value={String(rows.length)} /></View>;
}

function BookingSettingsFeature({ business }: { business: Business }) {
  const { save } = useBusiness();
  const [interval, setInterval] = useState(String(business.bookingSettings.interval || "30"));
  const [timeFormat, setTimeFormat] = useState(String(business.bookingSettings.timeFormat || "24"));
  const [cancellation, setCancellation] = useState(Boolean(business.bookingSettings.cancellation));
  const [reminder, setReminder] = useState(Boolean(business.bookingSettings.reminder));
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      await save({ bookingSettings: { ...business.bookingSettings, interval, timeFormat, cancellation, reminder } });
      Alert.alert("Kaydedildi", "Online randevu ayarları güncellendi.");
    } catch (caught) {
      Alert.alert("Kaydedilemedi", caught instanceof Error ? caught.message : "Lütfen yeniden deneyin.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollScreen>
      <PageHeader title="Online randevu ayarları" />
      <Card>
        <Field label="Randevu aralığı (dakika)" value={interval} onChangeText={setInterval} keyboardType="number-pad" />
        <Field label="Saat biçimi" value={timeFormat} onChangeText={setTimeFormat} placeholder="24" />
        <Toggle label="Müşteri iptaline izin ver" value={cancellation} onChange={setCancellation} />
        <Toggle label="Randevu hatırlatması" value={reminder} onChange={setReminder} />
        <Button loading={saving} onPress={() => void submit()}>Kaydet</Button>
      </Card>
    </ScrollScreen>
  );
}

function ConnectionSummary({ label, connected }: { label: string; connected: boolean }) {
  return <Card><View style={uiStyles.between}><Text style={styles.itemTitle}>{label}</Text><StatusPill label={connected ? "Bağlı" : "Bağlı değil"} tone={connected ? "success" : "warning"} /></View></Card>;
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return <View style={uiStyles.between}><Text style={styles.itemTitle}>{label}</Text><Switch value={value} onValueChange={onChange} trackColor={{ false: colors.border, true: colors.primary }} /></View>;
}

function RecordFeature({ view, business }: { view: DashboardFeatureId; business: Business }) {
  const { save } = useBusiness();
  const params = useLocalSearchParams<{ create?: string | string[] }>();
  const autoOpen = params.create === "1" || (Array.isArray(params.create) && params.create[0] === "1");
  const rows = view === "visit/list" ? business.checkouts : recordRows(view, business);
  const config = recordManagerConfig(view, business);

  async function saveRows(next: ManagedRecord[]) {
    if (view === "visit/list") {
      await save({ checkouts: next as unknown as Business["checkouts"] });
      return;
    }
    if (config?.promotionField) {
      await save({ promotions: { ...business.promotions, [config.promotionField]: next } });
    }
  }

  return (
    <ScrollScreen>
      <PageHeader title={featureLabel(view)} subtitle={`${rows.length} kayıt`} />
      {view === "visit/list" ? <CheckoutManager business={business} autoOpen={autoOpen} /> : null}
      {view === "product_sale/list" ? <SalesManager business={business} kind="product" autoOpen={autoOpen} /> : null}
      {view === "package_sale/list" ? <SalesManager business={business} kind="package" autoOpen={autoOpen} /> : null}
      {!(["visit/list", "product_sale/list", "package_sale/list"] as DashboardFeatureId[]).includes(view) && config ? (
        <EntityManager
          records={rows as ManagedRecord[]}
          fields={config.fields}
          createLabel={config.createLabel}
          {...(config.defaults ? { createDefaults: config.defaults } : {})}
          getTitle={(row) => String(row.title || row.customerName || row.personName || row.name || row.date || "Kayıt")}
          getSubtitle={(row) => config.subtitle(row)}
          onChange={saveRows}
          autoOpen={autoOpen}
        />
      ) : null}
      {!(["visit/list", "product_sale/list", "package_sale/list"] as DashboardFeatureId[]).includes(view) && !config ? <Card><Text style={uiStyles.body}>Bu görünüm için kayıt düzenleyicisi bulunamadı.</Text></Card> : null}
    </ScrollScreen>
  );
}

function RecordCard({ row }: { row: Record<string, unknown> }) {
  const entries = Object.entries(row).filter(([, value]) => ["string", "number", "boolean"].includes(typeof value)).slice(0, 7);
  const title = String(row.name || row.title || row.customerName || row.personName || row.date || "Kayıt");
  return (
    <Card>
      <Text style={styles.itemTitle}>{title}</Text>
      {entries.map(([key, value]) => <View key={key} style={uiStyles.between}><Text style={styles.key}>{key}</Text><Text style={styles.value} numberOfLines={2}>{typeof value === "boolean" ? (value ? "Evet" : "Hayır") : String(value)}</Text></View>)}
    </Card>
  );
}

function setupRows(view: DashboardFeatureId, business: Business) {
  if (["setup/staff"].includes(view)) return business.staff as unknown as Record<string, unknown>[];
  if (["setup/services", "setup/service_durations", "setup/service_prices"].includes(view)) return business.services as unknown as Record<string, unknown>[];
  if (view === "setup/products") return nestedRows(business, "products");
  if (view === "setup/service_packages") return nestedRows(business, "packages");
  if (view === "setup/tag_settings") return nestedRows(business, "tags");
  if (view === "setup/special-working-hours") return nestedRows(business, "specialWorkingHours");
  if (view === "setup/booking_settings") return [business.bookingSettings];
  return [];
}

type ManagedRecord = Record<string, unknown> & { id?: string };
type ManagerConfig = {
  fields: EntityField[];
  createLabel: string;
  promotionField?: string;
  defaults?: ManagedRecord;
  subtitle: (row: ManagedRecord) => string;
};

const today = () => new Date().toISOString().slice(0, 10);
const createdAt = () => new Date().toISOString();

function setupManagerConfig(view: DashboardFeatureId, business: Business): ManagerConfig | null {
  const staffOptions = business.staff.map((item) => ({ value: item.id, label: item.name, subtitle: item.role }));
  const serviceOptions = business.services.map((item) => ({ value: item.id, label: item.name, subtitle: `${item.duration} dk · ${money(item.price)}` }));
  const configs: Partial<Record<DashboardFeatureId, ManagerConfig>> = {
    "setup/staff": {
      createLabel: "Yeni personel",
      fields: [textField("name", "Ad soyad", true), textField("email", "E-posta"), textField("phone", "Telefon"), selectField("role", "Görev", [{ value: "Hesap sahibi", label: "Hesap sahibi" }, { value: "Personel", label: "Personel" }]), selectField("accessRole", "Erişim yetkisi", [{ value: "owner", label: "İşletme sahibi erişimi" }, { value: "employee", label: "Çalışan erişimi" }]), numberField("commissionRate", "Komisyon oranı"), textField("commissionNotes", "Komisyon notları", false, undefined, true), booleanField("onlineBooking", "Online randevuya açık"), booleanField("calendarVisible", "Takvimde göster")],
      defaults: { onlineBooking: true, calendarVisible: true, accessRole: "employee", workingHours: {} },
      subtitle: (row) => [row.role, row.phone].filter(Boolean).join(" · "),
    },
    "setup/services": {
      createLabel: "Yeni hizmet",
      fields: [textField("name", "Hizmet adı", true), selectField("gender", "Cinsiyet / hedef grup", [{ value: "Kadın", label: "Kadın" }, { value: "Erkek", label: "Erkek" }, { value: "Unisex", label: "Unisex" }]), numberField("duration", "Süre (dakika)"), selectField("priceType", "Fiyat türü", [{ value: "single", label: "Tek fiyat" }, { value: "range", label: "Fiyat aralığı" }]), numberField("price", "Tek fiyat"), numberField("minPrice", "En düşük fiyat"), numberField("maxPrice", "En yüksek fiyat"), multiSelectField("staffIds", "Hizmeti veren personeller", staffOptions, true)],
      defaults: { priceType: "single", minPrice: 0, maxPrice: 0, staffIds: [] },
      subtitle: (row) => `${Number(row.duration || 0)} dk · ${money(Number(row.price || 0))}`,
    },
    "setup/service_durations": {
      createLabel: "Yeni hizmet",
      fields: [textField("name", "Hizmet adı", true), numberField("duration", "Süre (dakika)"), multiSelectField("staffIds", "Hizmeti veren personeller", staffOptions, true)],
      defaults: { gender: "", priceType: "single", price: 0, minPrice: 0, maxPrice: 0, staffIds: [] },
      subtitle: (row) => `${Number(row.duration || 0)} dakika`,
    },
    "setup/service_prices": {
      createLabel: "Yeni hizmet",
      fields: [textField("name", "Hizmet adı", true), selectField("priceType", "Fiyat türü", [{ value: "single", label: "Tek fiyat" }, { value: "range", label: "Fiyat aralığı" }]), numberField("price", "Tek fiyat"), numberField("minPrice", "En düşük fiyat"), numberField("maxPrice", "En yüksek fiyat"), multiSelectField("staffIds", "Hizmeti veren personeller", staffOptions, true)],
      defaults: { gender: "", duration: 30, priceType: "single", staffIds: [] },
      subtitle: (row) => money(Number(row.price || row.minPrice || 0)),
    },
    "setup/products": {
      createLabel: "Yeni ürün",
      promotionField: "products",
      fields: [textField("name", "Ürün adı", true), textField("barcode", "Barkod"), numberField("price", "Satış fiyatı")],
      subtitle: (row) => `${row.barcode || "Barkod yok"} · ${money(Number(row.price || 0))}`,
    },
    "setup/service_packages": {
      createLabel: "Yeni paket",
      promotionField: "packages",
      fields: [textField("name", "Paket adı", true), textField("type", "Paket türü"), selectField("serviceId", "Hizmet", serviceOptions, true), numberField("quantity", "Seans adedi"), numberField("price", "Fiyat")],
      subtitle: (row) => `${Number(row.quantity || 0)} seans · ${money(Number(row.price || 0))}`,
    },
    "setup/tag_settings": {
      createLabel: "Yeni etiket",
      promotionField: "tags",
      fields: [textField("name", "Etiket adı", true), textField("color", "Renk kodu", false, "#7c3aed"), numberField("discountRate", "İndirim oranı")],
      defaults: { color: "#7c3aed" },
      subtitle: (row) => `%${Number(row.discountRate || 0)} indirim`,
    },
    "setup/special-working-hours": {
      createLabel: "Yeni dönem",
      promotionField: "specialWorkingHours",
      fields: [textField("title", "Başlık", true), textField("valid_from", "Başlangıç tarihi", true, "YYYY-AA-GG"), textField("valid_until", "Bitiş tarihi", true, "YYYY-AA-GG"), booleanField("open", "Çalışmaya açık")],
      defaults: { valid_from: today(), valid_until: today(), working_hours: {}, staffIds: [], open: true },
      subtitle: (row) => `${row.valid_from || ""} – ${row.valid_until || ""}`,
    },
  };
  return configs[view] || null;
}

function recordManagerConfig(view: DashboardFeatureId, business: Business): ManagerConfig | null {
  const staffOptions = business.staff.map((item) => ({ value: item.id, label: item.name, subtitle: item.role }));
  const customerNameOptions = business.customers.map((item) => ({ value: item.name, label: item.name, subtitle: [item.countryCode, item.phone].filter(Boolean).join(" ") }));
  const baseDateDefaults = { date: today(), createdAt: createdAt() };
  const configs: Partial<Record<DashboardFeatureId, ManagerConfig>> = {
    "visit/list": {
      createLabel: "Yeni adisyon",
      fields: [textField("customerName", "Müşteri", true), textField("date", "Tarih", true, "YYYY-AA-GG"), textField("hour", "Saat"), textField("minute", "Dakika"), textField("staffId", "Personel kimliği"), textField("serviceId", "Hizmet kimliği"), numberField("duration", "Süre"), numberField("amount", "Tutar"), numberField("discount", "İndirim"), textField("attendance", "Katılım"), textField("status", "Durum"), textField("notes", "Notlar", false, undefined, true)],
      defaults: { ...baseDateDefaults, hour: "09", minute: "00", duration: 30, amount: 0, discount: 0, status: "OPEN", attendance: "Belirtilmemiş", lines: [], payments: [] },
      subtitle: (row) => `${row.date || ""} · ${money(Number(row.amount || 0))}`,
    },
    "product_sale/list": saleConfig("Yeni ürün satışı", "productSales", false),
    "package_sale/list": saleConfig("Yeni paket satışı", "packageSales", true),
    "other/expense/list": {
      createLabel: "Yeni masraf", promotionField: "expenses",
      fields: [textField("date", "Tarih", true, "YYYY-AA-GG"), textField("category", "Kategori"), textField("title", "Açıklama", true), numberField("amount", "Tutar"), textField("paymentMethod", "Ödeme yöntemi"), textField("status", "Durum"), textField("notes", "Notlar", false, undefined, true)],
      defaults: { ...baseDateDefaults, status: "Ödendi", paymentMethod: "Nakit" }, subtitle: (row) => `${row.date || ""} · ${money(Number(row.amount || 0))}`,
    },
    "other/payment/list": {
      createLabel: "Yeni tahsilat", promotionField: "payments",
      fields: [textField("date", "Tarih", true, "YYYY-AA-GG"), selectField("customerName", "Müşteri", customerNameOptions, true), numberField("amount", "Tutar"), textField("method", "Ödeme yöntemi"), textField("source", "Kaynak"), textField("notes", "Notlar", false, undefined, true)],
      defaults: { ...baseDateDefaults, method: "Nakit", source: "Manuel" }, subtitle: (row) => `${row.date || ""} · ${money(Number(row.amount || 0))}`,
    },
    "other/receivable/list": ledgerConfig("Yeni alacak", "receivables", customerNameOptions),
    "other/debt/list": ledgerConfig("Yeni borç", "debts", customerNameOptions),
    "other/commissions": {
      createLabel: "Yeni komisyon", promotionField: "commissions",
      fields: [textField("date", "Tarih", true, "YYYY-AA-GG"), selectField("staffId", "Personel", staffOptions, true), textField("source", "Kaynak"), numberField("amount", "Tutar"), textField("status", "Durum")],
      defaults: { date: today(), source: "Randevu", status: "Bekliyor" }, subtitle: (row) => `${row.date || ""} · ${money(Number(row.amount || 0))}`,
    },
  };
  return configs[view] || null;
}

function saleConfig(createLabel: string, promotionField: string, packageSale: boolean): ManagerConfig {
  return {
    createLabel, promotionField,
    fields: [textField("date", "Tarih", true, "YYYY-AA-GG"), textField("customerName", "Müşteri", true), textField("sellerId", "Satış personeli kimliği"), numberField("total", "Toplam"), numberField("paidAmount", "Ödenen"), textField("notes", "Notlar", false, undefined, true), ...(packageSale ? [booleanField("hasExpiry", "Son kullanma tarihi var"), booleanField("createReceivable", "Alacak oluştur")] : [booleanField("paid", "Tamamı ödendi")])],
    defaults: { date: today(), createdAt: createdAt(), createdBy: "mobile", lines: [], total: 0, paidAmount: 0 },
    subtitle: (row) => `${row.date || ""} · ${money(Number(row.total || 0))}`,
  };
}

function ledgerConfig(createLabel: string, promotionField: string, customerOptions: NonNullable<EntityField["options"]>): ManagerConfig {
  return {
    createLabel, promotionField,
    fields: [textField("date", "Tarih", true, "YYYY-AA-GG"), selectField("personName", "Müşteri", customerOptions, true), numberField("amount", "Toplam tutar"), numberField("paidAmount", "Ödenen"), textField("description", "Açıklama", false, undefined, true), textField("status", "Durum")],
    defaults: { date: today(), createdAt: createdAt(), status: "Açık", paidAmount: 0 },
    subtitle: (row) => `${row.date || ""} · ${money(Number(row.amount || 0))}`,
  };
}

function textField(key: string, label: string, required = false, placeholder?: string, multiline = false): EntityField {
  return { key, label, type: "text", required, multiline, ...(placeholder ? { placeholder } : {}) };
}
function numberField(key: string, label: string): EntityField { return { key, label, type: "number" }; }
function booleanField(key: string, label: string): EntityField { return { key, label, type: "boolean" }; }
function selectField(key: string, label: string, options: NonNullable<EntityField["options"]>, required = false): EntityField { return { key, label, type: "select", options, required }; }
function multiSelectField(key: string, label: string, options: NonNullable<EntityField["options"]>, required = false): EntityField { return { key, label, type: "multiselect", options, required }; }

function recordRows(view: DashboardFeatureId, business: Business) {
  const map: Partial<Record<DashboardFeatureId, string>> = {
    "product_sale/list": "productSales",
    "package_sale/list": "packageSales",
    "other/commissions": "commissions",
    "other/expense/list": "expenses",
    "other/payment/list": "payments",
    "other/receivable/list": "receivables",
    "other/debt/list": "debts",
  };
  const field = map[view];
  return field ? nestedRows(business, field) : [];
}

function nestedRows(business: Business, field: string): Record<string, unknown>[] {
  const value = business.promotions[field];
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item)) : [];
}

function sumRecords(rows: Record<string, unknown>[], key: string) {
  return rows.reduce((total, row) => total + Number(row[key] || 0), 0);
}

function withinPeriod(date: string, from: string, to: string) {
  return Boolean(date) && (!from || date >= from) && (!to || date <= to);
}

function reportBounds(period: string) {
  const now = new Date();
  const todayValue = now.toISOString().slice(0, 10);
  if (period === "Bugün") return { from: todayValue, to: todayValue };
  if (period === "Tümü") return { from: "", to: "" };
  return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10), to: todayValue };
}

function isMessageInPeriod(date: string, period: string) {
  if (period === "Tümü") return true;
  const now = new Date();
  const todayValue = now.toISOString().slice(0, 10);
  if (period === "Bugün") return date === todayValue;
  return date.slice(0, 7) === todayValue.slice(0, 7);
}

function money(value: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(value);
}

function checkoutLineNames(checkout: Business["checkouts"][number], business: Business) {
  const lines = checkout.lines || [];
  return lines.map((line) => business.services.find((service) => service.id === String(line.serviceId || ""))?.name).filter(Boolean).join(", ") || business.services.find((service) => service.id === checkout.serviceId)?.name || "Adisyon";
}

function offsetDate(value: string, amount: number) {
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return today();
  parsed.setDate(parsed.getDate() + amount);
  return parsed.toISOString().slice(0, 10);
}

const styles = StyleSheet.create({
  itemTitle: { color: colors.text, fontSize: 16, fontWeight: "800", flexShrink: 1 },
  key: { color: colors.textMuted, fontSize: 12, fontWeight: "700", maxWidth: "45%" },
  value: { color: colors.text, fontSize: 13, fontWeight: "600", textAlign: "right", flex: 1 },
  profileImage: { width: 64, height: 64, borderRadius: radii.lg },
  qrImage: { width: "100%", aspectRatio: 1, borderRadius: radii.md, backgroundColor: colors.white },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  financeSummary: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  reportActions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  metric: { flexBasis: 140, flexGrow: 1 },
  metricValue: { color: colors.text, fontSize: 21, fontWeight: "900" },
  dateActions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  calendarCard: { padding: spacing.md, gap: 0 },
  calendarDate: { color: colors.text, fontSize: 16, fontWeight: "800", paddingBottom: spacing.md, textTransform: "capitalize" },
  calendarRow: { minHeight: 64, flexDirection: "row", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  calendarHour: { width: 52, paddingTop: spacing.sm, color: colors.textMuted, fontSize: 11, fontWeight: "700" },
  calendarCell: { flex: 1, minHeight: 64, paddingVertical: spacing.xs, gap: spacing.xs },
  emptySlot: { flex: 1, minHeight: 48, backgroundColor: "#FFFDF0" },
  calendarEvent: { borderRadius: radii.sm, borderLeftWidth: 4, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, backgroundColor: colors.surface },
  appointmentEvent: { borderLeftColor: "#5F86B6" },
  checkoutEvent: { borderLeftColor: "#24A647" },
  calendarEventTitle: { color: colors.text, fontSize: 12, fontWeight: "800" },
  calendarEventBody: { color: colors.textMuted, fontSize: 11 },
  statusFilters: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  statusFilter: { borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  statusFilterActive: { backgroundColor: colors.surfaceMuted, borderColor: colors.text },
  statusFilterText: { color: colors.textMuted, fontSize: 12, fontWeight: "700" },
  statusFilterTextActive: { color: colors.text },
  messageBubble: { maxWidth: "86%", padding: spacing.md, borderRadius: radii.lg, gap: spacing.xs },
  customerMessage: { alignSelf: "flex-end", backgroundColor: colors.primary },
  assistantMessage: { alignSelf: "flex-start", backgroundColor: colors.text },
  messageRole: { color: colors.white, fontSize: 10, fontWeight: "900", opacity: 0.72 },
  messageText: { color: colors.white, fontSize: 14, lineHeight: 20 },
});
