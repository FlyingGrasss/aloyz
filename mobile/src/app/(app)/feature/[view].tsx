import { useState } from "react";
import { Alert, Image, StyleSheet, Switch, Text, View } from "react-native";
import { Redirect, useLocalSearchParams } from "expo-router";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { BusinessGate } from "@/components/BusinessGate";
import { EntityManager, type EntityField } from "@/components/EntityManager";
import { Button, Card, Field, MessageState, PageHeader, ScrollScreen, StatusPill, uiStyles } from "@/components/ui";
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
  const [selectedDate, setSelectedDate] = useState(today());
  const appointments = business.appointments
    .filter((item) => item.date === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time));
  const checkouts = business.checkouts
    .filter((item) => item.date === selectedDate)
    .sort((a, b) => `${a.hour}:${a.minute}`.localeCompare(`${b.hour}:${b.minute}`));

  return (
    <ScrollScreen>
      <PageHeader title="Randevu takvimi" subtitle={business.calendarId ? "Google Takvim bağlı" : "Yerel dashboard kayıtları"} />
      <Card>
        <Field label="Görüntülenecek tarih" value={selectedDate} onChangeText={setSelectedDate} placeholder="YYYY-AA-GG" />
        <View style={styles.dateActions}>
          <Button variant="secondary" onPress={() => setSelectedDate(offsetDate(selectedDate, -1))}>Önceki gün</Button>
          <Button variant="secondary" onPress={() => setSelectedDate(today())}>Bugün</Button>
          <Button variant="secondary" onPress={() => setSelectedDate(offsetDate(selectedDate, 1))}>Sonraki gün</Button>
        </View>
      </Card>
      <Text style={uiStyles.sectionTitle}>Randevular</Text>
      {appointments.map((item) => (
        <Card key={item.id}>
          <View style={uiStyles.between}><Text style={styles.itemTitle}>{item.time} · {item.customerName}</Text><StatusPill label={item.status} /></View>
          <Text style={uiStyles.body}>{item.phone}{item.description ? ` · ${item.description}` : ""}</Text>
        </Card>
      ))}
      {!appointments.length ? <Card><Text style={uiStyles.body}>Bu tarihte randevu yok.</Text></Card> : null}
      <Text style={uiStyles.sectionTitle}>Adisyonlar</Text>
      {checkouts.map((item) => (
        <Card key={item.id}><Text style={styles.itemTitle}>{item.hour}:{item.minute} · {item.customerName}</Text><Text style={uiStyles.body}>{money(item.amount)} · {item.status}</Text></Card>
      ))}
      {!checkouts.length ? <Card><Text style={uiStyles.body}>Bu tarihte adisyon yok.</Text></Card> : null}
    </ScrollScreen>
  );
}

function MessagingFeature({ view, business }: { view: DashboardFeatureId; business: Business }) {
  const [selected, setSelected] = useState<Conversation | null>(null);
  const channel = view.includes("instagram") ? "instagram" : view.endsWith("sent-reminders") ? null : "whatsapp";
  const setup = view.endsWith("/setup") || view.endsWith("/register");
  const conversations = business.conversations.filter((item) => !channel || item.channel === channel);
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
  const now = new Date();
  const [from, setFrom] = useState(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10));
  const [to, setTo] = useState(today());
  const checkouts = business.checkouts.filter((item) => withinPeriod(item.date, from, to));
  const sales = [...nestedRows(business, "productSales"), ...nestedRows(business, "packageSales")].filter((item) => withinPeriod(String(item.date || ""), from, to));
  const expenses = nestedRows(business, "expenses").filter((item) => withinPeriod(String(item.date || ""), from, to));
  const checkoutTotal = sumRecords(checkouts, "amount");
  const salesTotal = sumRecords(sales, "total");
  const expenseTotal = sumRecords(expenses, "amount");
  const staffCounts = business.staff.map((staff) => ({ staff, count: checkouts.filter((item) => String(item.staffId || "") === staff.id).length }));

  async function exportReport() {
    const rows = view === "report/staff"
      ? [["Personel", "Adisyon"], ...staffCounts.map(({ staff, count }) => [staff.name, String(count)])]
      : [["Kalem", "Tutar"], ["Adisyon", String(checkoutTotal)], ["Ürün ve paket", String(salesTotal)], ["Masraf", String(expenseTotal)], ["Net", String(checkoutTotal + salesTotal - expenseTotal)]];
    try {
      await shareCsv(`aloyz-${view.replace("/", "-")}-${from}-${to}.csv`, rows);
    } catch (caught) {
      Alert.alert("Rapor paylaşılamadı", caught instanceof Error ? caught.message : "Lütfen yeniden deneyin.");
    }
  }

  return (
    <ScrollScreen>
      <PageHeader title={featureLabel(view)} subtitle="Canlı işletme verilerinden hesaplanır." />
      <Card>
        <Field label="Başlangıç" value={from} onChangeText={setFrom} placeholder="YYYY-AA-GG" />
        <Field label="Bitiş" value={to} onChangeText={setTo} placeholder="YYYY-AA-GG" />
        <Button variant="secondary" onPress={() => void exportReport()}>CSV olarak paylaş</Button>
      </Card>
      {view === "report/staff" ? staffCounts.map(({ staff, count }) => <Card key={staff.id}><Text style={styles.itemTitle}>{staff.name}</Text><Text style={uiStyles.body}>{count} adisyon</Text></Card>) : (
        <View style={styles.metricGrid}>
          <Metric label="Adisyon" value={money(checkoutTotal)} />
          <Metric label="Ürün ve paket" value={money(salesTotal)} />
          <Metric label="Masraf" value={money(expenseTotal)} />
          <Metric label="Net" value={money(checkoutTotal + salesTotal - expenseTotal)} />
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

  const config = setupManagerConfig(view);

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
  const rows = view === "visit/list" ? business.checkouts : recordRows(view, business);
  const config = recordManagerConfig(view);

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
      {config ? (
        <EntityManager
          records={rows as ManagedRecord[]}
          fields={config.fields}
          createLabel={config.createLabel}
          {...(config.defaults ? { createDefaults: config.defaults } : {})}
          getTitle={(row) => String(row.title || row.customerName || row.personName || row.name || row.date || "Kayıt")}
          getSubtitle={(row) => config.subtitle(row)}
          onChange={saveRows}
        />
      ) : <Card><Text style={uiStyles.body}>Bu görünüm için kayıt düzenleyicisi bulunamadı.</Text></Card>}
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

function setupManagerConfig(view: DashboardFeatureId): ManagerConfig | null {
  const configs: Partial<Record<DashboardFeatureId, ManagerConfig>> = {
    "setup/staff": {
      createLabel: "Yeni personel",
      fields: [textField("name", "Ad soyad", true), textField("email", "E-posta"), textField("phone", "Telefon"), textField("role", "Görev"), numberField("commissionRate", "Komisyon oranı"), booleanField("onlineBooking", "Online randevuya açık"), booleanField("calendarVisible", "Takvimde göster")],
      defaults: { onlineBooking: true, calendarVisible: true, accessRole: "employee", workingHours: {} },
      subtitle: (row) => [row.role, row.phone].filter(Boolean).join(" · "),
    },
    "setup/services": {
      createLabel: "Yeni hizmet",
      fields: [textField("name", "Hizmet adı", true), textField("gender", "Cinsiyet / hedef grup"), numberField("duration", "Süre (dakika)"), numberField("price", "Fiyat")],
      defaults: { priceType: "single", minPrice: 0, maxPrice: 0, staffIds: [] },
      subtitle: (row) => `${Number(row.duration || 0)} dk · ${money(Number(row.price || 0))}`,
    },
    "setup/service_durations": {
      createLabel: "Yeni hizmet",
      fields: [textField("name", "Hizmet adı", true), numberField("duration", "Süre (dakika)")],
      defaults: { gender: "", priceType: "single", price: 0, minPrice: 0, maxPrice: 0, staffIds: [] },
      subtitle: (row) => `${Number(row.duration || 0)} dakika`,
    },
    "setup/service_prices": {
      createLabel: "Yeni hizmet",
      fields: [textField("name", "Hizmet adı", true), numberField("price", "Tek fiyat"), numberField("minPrice", "En düşük fiyat"), numberField("maxPrice", "En yüksek fiyat")],
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
      fields: [textField("name", "Paket adı", true), textField("type", "Paket türü"), textField("serviceId", "Hizmet kimliği"), numberField("quantity", "Seans adedi"), numberField("price", "Fiyat")],
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

function recordManagerConfig(view: DashboardFeatureId): ManagerConfig | null {
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
      fields: [textField("date", "Tarih", true, "YYYY-AA-GG"), textField("customerName", "Müşteri", true), numberField("amount", "Tutar"), textField("method", "Ödeme yöntemi"), textField("source", "Kaynak"), textField("notes", "Notlar", false, undefined, true)],
      defaults: { ...baseDateDefaults, method: "Nakit", source: "Manuel" }, subtitle: (row) => `${row.date || ""} · ${money(Number(row.amount || 0))}`,
    },
    "other/receivable/list": ledgerConfig("Yeni alacak", "receivables"),
    "other/debt/list": ledgerConfig("Yeni borç", "debts"),
    "other/commissions": {
      createLabel: "Yeni komisyon", promotionField: "commissions",
      fields: [textField("date", "Tarih", true, "YYYY-AA-GG"), textField("staffId", "Personel kimliği", true), textField("source", "Kaynak"), numberField("amount", "Tutar"), textField("status", "Durum")],
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

function ledgerConfig(createLabel: string, promotionField: string): ManagerConfig {
  return {
    createLabel, promotionField,
    fields: [textField("date", "Tarih", true, "YYYY-AA-GG"), textField("personName", "Kişi / kurum", true), numberField("amount", "Toplam tutar"), numberField("paidAmount", "Ödenen"), textField("description", "Açıklama", false, undefined, true), textField("status", "Durum")],
    defaults: { date: today(), createdAt: createdAt(), status: "Açık", paidAmount: 0 },
    subtitle: (row) => `${row.date || ""} · ${money(Number(row.amount || 0))}`,
  };
}

function textField(key: string, label: string, required = false, placeholder?: string, multiline = false): EntityField {
  return { key, label, type: "text", required, multiline, ...(placeholder ? { placeholder } : {}) };
}
function numberField(key: string, label: string): EntityField { return { key, label, type: "number" }; }
function booleanField(key: string, label: string): EntityField { return { key, label, type: "boolean" }; }

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

function money(value: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(value);
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
  metric: { flexBasis: 140, flexGrow: 1 },
  metricValue: { color: colors.text, fontSize: 21, fontWeight: "900" },
  dateActions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  messageBubble: { maxWidth: "86%", padding: spacing.md, borderRadius: radii.lg, gap: spacing.xs },
  customerMessage: { alignSelf: "flex-end", backgroundColor: colors.primary },
  assistantMessage: { alignSelf: "flex-start", backgroundColor: colors.text },
  messageRole: { color: colors.white, fontSize: 10, fontWeight: "900", opacity: 0.72 },
  messageText: { color: colors.white, fontSize: 14, lineHeight: 20 },
});
