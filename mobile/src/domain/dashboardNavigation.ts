export type DashboardFeatureId =
  | "calendar"
  | "booking/list"
  | "visit/list"
  | "client/list"
  | "product_sale/list"
  | "package_sale/list"
  | "report/cashier"
  | "report/staff"
  | "report/sales"
  | "messaging/whatsapp/sent-reminders"
  | "messaging/whatsapp/register"
  | "messaging/whatsapp/list"
  | "messaging/instagram/setup"
  | "messaging/instagram/list"
  | "other/commissions"
  | "other/expense/list"
  | "other/payment/list"
  | "other/receivable/list"
  | "other/debt/list"
  | "subscription"
  | "invoice/list"
  | "setup/general"
  | "setup/working-hours"
  | "setup/special-working-hours"
  | "setup/staff"
  | "setup/services"
  | "setup/service_durations"
  | "setup/service_prices"
  | "setup/products"
  | "setup/service_packages"
  | "setup/booking_settings"
  | "setup/tag_settings"
  | "setup/salon-bot-settings"
  | "setup/connections";

export type DashboardFeature = { id: DashboardFeatureId; label: string };
export type DashboardFeatureGroup = { label: string; items: DashboardFeature[] };

export const dashboardFeatureGroups: DashboardFeatureGroup[] = [
  {
    label: "Operasyon",
    items: [
      { id: "calendar", label: "Randevu takvimi" },
      { id: "booking/list", label: "Randevular" },
      { id: "visit/list", label: "Adisyonlar" },
      { id: "client/list", label: "Müşteriler" },
      { id: "product_sale/list", label: "Ürün satışları" },
      { id: "package_sale/list", label: "Paket satışları" },
    ],
  },
  {
    label: "Raporlar",
    items: [
      { id: "report/cashier", label: "Kasa raporu" },
      { id: "report/staff", label: "Personel raporu" },
      { id: "report/sales", label: "Satış raporu" },
    ],
  },
  {
    label: "Mesajlaşma",
    items: [
      { id: "messaging/whatsapp/sent-reminders", label: "Tüm mesajlar" },
      { id: "messaging/whatsapp/register", label: "WhatsApp kurulumu" },
      { id: "messaging/whatsapp/list", label: "WhatsApp mesajları" },
      { id: "messaging/instagram/setup", label: "Instagram kurulumu" },
      { id: "messaging/instagram/list", label: "Instagram mesajları" },
    ],
  },
  {
    label: "Diğer kayıtlar",
    items: [
      { id: "other/commissions", label: "Randevu komisyonları" },
      { id: "other/expense/list", label: "Masraflar" },
      { id: "other/payment/list", label: "Tahsilatlar" },
      { id: "other/receivable/list", label: "Alacaklar" },
      { id: "other/debt/list", label: "Borçlar" },
    ],
  },
  {
    label: "Hesap",
    items: [
      { id: "subscription", label: "Abonelik" },
      { id: "invoice/list", label: "Faturalar" },
    ],
  },
  {
    label: "Kurulum",
    items: [
      { id: "setup/general", label: "İşletme bilgileri" },
      { id: "setup/working-hours", label: "Çalışma saatleri" },
      { id: "setup/special-working-hours", label: "Dönemsel çalışma saatleri" },
      { id: "setup/staff", label: "Personeller" },
      { id: "setup/services", label: "Hizmetler" },
      { id: "setup/service_durations", label: "Hizmet süreleri" },
      { id: "setup/service_prices", label: "Hizmet fiyatları" },
      { id: "setup/products", label: "Ürünler" },
      { id: "setup/service_packages", label: "Paketler" },
      { id: "setup/booking_settings", label: "Randevu ayarları" },
      { id: "setup/tag_settings", label: "Etiket ayarları" },
      { id: "setup/salon-bot-settings", label: "Bot ayarları" },
      { id: "setup/connections", label: "Bağlantılar / Entegrasyonlar" },
    ],
  },
];

export function encodeFeatureId(id: DashboardFeatureId) {
  return id.replaceAll("/", "--");
}

export function decodeFeatureId(value: string): DashboardFeatureId | null {
  const decoded = value.replaceAll("--", "/") as DashboardFeatureId;
  return dashboardFeatureGroups.some((group) => group.items.some((item) => item.id === decoded))
    ? decoded
    : null;
}

export function featureLabel(id: DashboardFeatureId) {
  return dashboardFeatureGroups.flatMap((group) => group.items).find((item) => item.id === id)?.label || id;
}
