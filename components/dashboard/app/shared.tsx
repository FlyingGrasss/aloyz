"use client";

import type React from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  FileText,
  Home,
  Info,
  Languages,
  LayoutDashboard,
  Link as LinkIcon,
  List,
  LockKeyhole,
  LogOut,
  Menu,
  MessageCircle,
  MoreVertical,
  Package,
  Percent,
  Phone,
  Plus,
  ReceiptText,
  Search,
  Settings,
  ShoppingBag,
  Tag,
  Upload,
  UserPlus,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { getContactDisplayName, getContactSubtitle } from "@/lib/contactDisplay";

export type ViewId =
  | "dashboard"
  | "calendar"
  | "booking/list"
  | "visit/list"
  | "client/list"
  | "product_sale/list"
  | "package_sale/list"
  | "pos/pos_application"
  | "report/cashier"
  | "report/staff"
  | "report/sales"
  | "messaging/whatsapp/sent-reminders"
  | "messaging/whatsapp/register"
  | "messaging/whatsapp/reminder-messages"
  | "messaging/instagram/list"
  | "messaging/instagram/dashboard"
  | "sms/apply"
  | "other/commissions"
  | "other/review/list"
  | "other/call_log/list"
  | "other/expense/list"
  | "other/payment/list"
  | "other/receivable/list"
  | "other/debt/list"
  | "subscription"
  | "invoice/list"
  | SetupViewId;

export type SetupViewId =
  | "setup/general"
  | "setup/working-hours"
  | "setup/special-working-hours"
  | "setup/staff"
  | "setup/services"
  | "setup/service_durations"
  | "setup/service_prices"
  | "setup/promotions"
  | "setup/products"
  | "setup/service_packages"
  | "setup/booking_settings"
  | "setup/tag_settings"
  | "setup/salon-bot-settings"
  | "setup/instagram-audiences"
  | "setup/connections";

export type Conversation = {
  id: string;
  customerJid: string;
  channel: string;
  customerName: string | null;
  customerPhone: string | null;
  instagramUsername: string | null;
  messages: unknown;
  createdAt: string;
  updatedAt: string;
};

export type Appointment = {
  id: string;
  customerName: string;
  phone: string;
  date: string;
  time: string;
  description: string;
  status: string;
  createdAt: string;
};

export type StaffMember = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  onlineBooking: boolean;
  calendarVisible: boolean;
};

export type ServiceItem = {
  id: string;
  name: string;
  gender: string;
  duration: number;
  priceType: "single" | "range";
  price: number;
  minPrice: number;
  maxPrice: number;
  staffIds: string[];
};

export type CustomerProfile = {
  id: string;
  name: string;
  countryCode: string;
  phone: string;
  email: string;
  birthDate: string;
  gender: string;
  notes: string;
  fileNumber: string;
  instagramUsername: string;
  discountEnabled: boolean;
  discountRate: number;
  tags: string[];
};

export type CheckoutItem = {
  id: string;
  customerName: string;
  date: string;
  hour: string;
  minute: string;
  notes: string;
  staffId: string;
  serviceId: string;
  duration: number;
  amount: number;
  discount: number;
  status: string;
  createdAt: string;
};

export type PromotionsSettings = {
  cashReward: string;
  cardReward: string;
  rewardUsage: string;
  birthdayDiscount: string;
  onlineBookingDiscount: string;
};

export type BookingSettings = {
  interval: string;
  timeFormat: string;
  cancellation: boolean;
  reminder: boolean;
  createdNotification: boolean;
  packageWindow: boolean;
  waitingListWindow: boolean;
  googleOnlineBooking: boolean;
};

export type BotSettings = {
  instagram: boolean;
  whatsapp: boolean;
};

export type Business = {
  id: string;
  slug: string;
  name: string;
  type: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  district: string | null;
  address: string | null;
  website: string | null;
  calendarId: string | null;
  welcome_message: string | null;
  hours: Record<string, string>;
  menu_or_services: string;
  faqs: Array<{ question: string; answer: string }>;
  staff: StaffMember[];
  services: ServiceItem[];
  customers: CustomerProfile[];
  checkouts: CheckoutItem[];
  promotions: PromotionsSettings;
  bookingSettings: BookingSettings;
  botSettings: BotSettings;
  special_instructions: string | null;
  is_active: boolean;
  test_mode: boolean;
  instagram_page_id: string | null;
  conversations: Conversation[];
  appointments: Appointment[];
};

export type NavItem = {
  id: ViewId;
  label: string;
  icon: LucideIcon;
  beta?: boolean;
};

export type NavGroup = {
  key: string;
  label: string;
  icon: LucideIcon;
  children: Array<NavItem | NavSubGroup>;
  beta?: boolean;
};

export type NavSubGroup = {
  key: string;
  label: string;
  icon: LucideIcon;
  children: NavItem[];
  beta?: boolean;
};

export type ContactRow = {
  id: string;
  name: string;
  subtitle: string;
  channel: string;
  phone: string;
  username: string;
  updatedAt: string;
  messageCount: number;
  appointmentCount: number;
  lastMessage: string;
  conversation: Conversation;
};

export const DAYS = [
  { key: "pazartesi", short: "Pts", label: "Pazartesi" },
  { key: "sali", short: "Sal", label: "Salı" },
  { key: "carsamba", short: "Çar", label: "Çarşamba" },
  { key: "persembe", short: "Per", label: "Perşembe" },
  { key: "cuma", short: "Cum", label: "Cuma" },
  { key: "cumartesi", short: "Cts", label: "Cumartesi" },
  { key: "pazar", short: "Paz", label: "Pazar" },
];

export const TIME_OPTIONS = Array.from({ length: 49 }, (_, index) => {
  const totalMinutes = index * 30;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
});

export const GOOGLE_SERVICE_ACCOUNT_EMAIL =
  "arkansas@arkansas-495411.iam.gserviceaccount.com";

export const setupItems: NavItem[] = [
  { id: "setup/general", label: "Bilgileri", icon: Info },
  { id: "setup/working-hours", label: "Çalışma saatleri", icon: Settings },
  {
    id: "setup/special-working-hours",
    label: "Dönemsel çalışma saatleri",
    icon: CalendarDays,
  },
  { id: "setup/staff", label: "Personeller", icon: Users },
  { id: "setup/services", label: "Hizmetler", icon: List },
  { id: "setup/service_durations", label: "Hizmet süreleri", icon: Clock3 },
  {
    id: "setup/service_prices",
    label: "Hizmet fiyatları",
    icon: CircleDollarSign,
  },
  { id: "setup/promotions", label: "Promosyonlar", icon: Percent },
  { id: "setup/products", label: "Ürünler", icon: Tag },
  { id: "setup/service_packages", label: "Paketler", icon: Package },
  {
    id: "setup/booking_settings",
    label: "Randevu ayarları",
    icon: CalendarDays,
  },
  { id: "setup/tag_settings", label: "Etiket ayarları", icon: Tag },
  {
    id: "setup/salon-bot-settings",
    label: "Salon BOT Ayarları",
    icon: MessageCircle,
  },
  {
    id: "setup/instagram-audiences",
    label: "Meta Hedef Kitleleri",
    icon: Users,
  },
  {
    id: "setup/connections",
    label: "Bağlantılar / Entegrasyonlar",
    icon: LinkIcon,
  },
];

export const primaryNav: NavItem[] = [
  { id: "dashboard", label: "Özet", icon: Home },
  { id: "calendar", label: "Randevu takvimi", icon: CalendarDays },
  { id: "booking/list", label: "Randevular", icon: Clock3 },
  { id: "visit/list", label: "Adisyonlar", icon: List },
  { id: "client/list", label: "Müşteriler", icon: Users },
  { id: "product_sale/list", label: "Ürün satışları", icon: Tag },
  { id: "package_sale/list", label: "Paket satışları", icon: Package },
];

export const navGroups: NavGroup[] = [
  {
    key: "reports",
    label: "Raporlar",
    icon: FileText,
    children: [
      { id: "report/cashier", label: "Kasa raporu", icon: ReceiptText },
      { id: "report/staff", label: "Personel raporu", icon: Users },
      { id: "report/sales", label: "Satış raporu", icon: ShoppingBag },
    ],
  },
  {
    key: "messaging",
    label: "Mesajlaşma",
    icon: MessageCircle,
    children: [
      {
        key: "messaging-whatsapp",
        label: "WhatsApp",
        icon: MessageCircle,
        children: [
          {
            id: "messaging/whatsapp/sent-reminders",
            label: "Otomatik Mesajlar",
            icon: Bell,
          },
          {
            id: "messaging/whatsapp/register",
            label: "İşletme Kaydı",
            icon: MessageCircle,
          },
          {
            id: "messaging/whatsapp/reminder-messages",
            label: "Hatırlatma Yanıtları",
            icon: WalletCards,
          },
        ],
      },
      {
        key: "messaging-instagram",
        label: "Instagram",
        icon: MessageCircle,
        children: [
          {
            id: "messaging/instagram/list",
            label: "Mesajlar",
            icon: MessageCircle,
          },
        ],
      },
    ],
  },
  {
    key: "other",
    label: "Diğer",
    icon: MoreVertical,
    children: [
      { id: "other/commissions", label: "Randevu Komisyonları", icon: Percent },
      { id: "other/review/list", label: "Yorumlar", icon: MessageCircle },
      { id: "other/call_log/list", label: "Arama kayıtları", icon: Phone },
      { id: "other/expense/list", label: "Masraflar", icon: Upload },
      { id: "other/payment/list", label: "Tahsilatlar", icon: WalletCards },
      { id: "other/receivable/list", label: "Alacaklar", icon: ReceiptText },
      { id: "other/debt/list", label: "Borçlar", icon: BriefcaseBusiness },
    ],
  },
];

export const createItems = [
  { label: "Yeni randevu", icon: CalendarDays },
  { label: "Yeni adisyon", icon: List },
  { label: "Yeni müşteri", icon: UserPlus },
  { label: "Yeni ürün satışı", icon: Tag },
  { label: "Yeni paket satışı", icon: Package },
  { label: "Yeni masraf", icon: Upload },
  { label: "Yeni alacak", icon: ReceiptText },
  { label: "Yeni borç", icon: BriefcaseBusiness },
];

export const defaultBusiness: Business = {
  id: "",
  slug: "",
  name: "",
  type: "",
  phone: "",
  email: "",
  city: "",
  district: "",
  address: "",
  website: "",
  calendarId: "",
  welcome_message: "",
  hours: {},
  menu_or_services: "",
  faqs: [],
  staff: [],
  services: [],
  customers: [],
  checkouts: [],
  promotions: {
    cashReward: "",
    cardReward: "",
    rewardUsage: "",
    birthdayDiscount: "",
    onlineBookingDiscount: "",
  },
  bookingSettings: {
    interval: "30",
    timeFormat: "24",
    cancellation: false,
    reminder: false,
    createdNotification: false,
    packageWindow: false,
    waitingListWindow: false,
    googleOnlineBooking: false,
  },
  botSettings: {
    instagram: false,
    whatsapp: false,
  },
  special_instructions: "",
  is_active: false,
  test_mode: false,
  instagram_page_id: null,
  conversations: [],
  appointments: [],
};

export function PlaceholderPage({
  view,
  compact,
}: {
  view: ViewId;
  compact?: boolean;
}) {
  const label = getViewLabel(view);
  return (
    <div className={compact ? "" : "space-y-4"}>
      {!compact && <Breadcrumb items={["Aloyz", label]} />}
      <section className="rounded bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-700">{label}</h1>
        <div className="mt-5 border-t border-slate-200 pt-5">
          <EmptyState
            title="Sayfa hazır"
            description="Bu bölümün gerçek içeriği sırayla entegre edilecek."
          />
        </div>
      </section>
    </div>
  );
}

export function SettingsPanel({
  title,
  saving,
  onSave,
  children,
}: {
  title: string;
  saving: boolean;
  onSave: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded bg-white p-4 shadow-sm">
      <h1 className="mb-8 text-2xl font-semibold text-slate-700">{title}</h1>
      <div className="grid gap-3">{children}</div>
      <Button
        type="button"
        disabled={saving}
        onClick={onSave}
        className="mt-5 w-full bg-[#5f86b6] text-white"
      >
        {saving ? "Kaydediliyor..." : "Kaydet"}
      </Button>
    </section>
  );
}

export function SettingsSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid items-center gap-4 text-sm md:grid-cols-[minmax(240px,1fr)_270px]">
      <span>{label}</span>
      <NativeSelect value={value} options={options} onChange={onChange} />
    </div>
  );
}

export function SettingsToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="grid items-center gap-4 text-sm md:grid-cols-[minmax(240px,1fr)_270px]">
      <span>{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export function ModalHeader({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
      <h2 className="font-semibold">{title}</h2>
      <button
        type="button"
        onClick={onClose}
        className="grid size-8 place-items-center rounded hover:bg-slate-100"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

export function UtilityModal({
  type,
  onClose,
  onLogout,
}: {
  type: string;
  onClose: () => void;
  onLogout: () => void;
}) {
  const title =
    type === "theme"
      ? "Tema ayarları"
      : type === "language"
        ? "Dil değiştir"
        : type === "password"
          ? "Şifre değiştir"
          : type === "notifications"
            ? "Bildirimler"
            : "Yeni kayıt";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4">
      <section className="w-full max-w-md rounded bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded hover:bg-slate-100"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="space-y-4 p-4">
          {type === "theme" && (
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                className="bg-white text-slate-800 ring-1 ring-slate-200"
              >
                Açık tema
              </Button>
              <Button type="button" variant="outline">
                Koyu tema
              </Button>
            </div>
          )}
          {type === "language" && (
            <div className="grid grid-cols-2 gap-3">
              <Button type="button" className="bg-[#5f86b6] text-white">
                Türkçe
              </Button>
              <Button type="button" variant="outline">
                English
              </Button>
            </div>
          )}
          {type === "password" && (
            <div className="grid gap-3">
              <Input type="password" placeholder="Mevcut şifre" />
              <Input type="password" placeholder="Yeni şifre" />
              <Input type="password" placeholder="Yeni şifre tekrar" />
              <Button type="button" className="bg-[#5f86b6] text-white">
                Kaydet
              </Button>
            </div>
          )}
          {type === "notifications" && (
            <EmptyState
              title="Bildirim yok"
              description="Yeni bildirimler burada görünecek."
            />
          )}
          {type === "create" && (
            <EmptyState
              title="Kayıt oluşturma"
              description="Bu akış bir sonraki adımda gerçek formlara bağlanacak."
            />
          )}
          {type === "logout" && (
            <Button type="button" onClick={onLogout}>
              Çıkış
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4">
      <section className="w-full max-w-sm rounded bg-white p-4 shadow-xl">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className="bg-[#5f86b6] text-white"
          >
            {confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}

export function Dropdown({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <div
      className={`absolute right-0 top-full z-40 mt-2 rounded-sm border border-slate-200 bg-white shadow-lg ${className}`}
    >
      {children}
    </div>
  );
}

export function DropdownButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-9 w-full items-center gap-3 px-3 text-left text-sm text-slate-600 hover:bg-slate-50"
    >
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <Icon className="size-4 text-slate-500" />
    </button>
  );
}

export function NativeSelect({
  value,
  options,
  disabled,
  onChange,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className="h-8 w-full rounded border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm disabled:bg-slate-100"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold uppercase text-slate-400">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-slate-700">{value}</div>
    </div>
  );
}

export function ActionPanel({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded bg-white p-4 text-left shadow-sm hover:bg-slate-50"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        <ChevronRight className="size-4 text-slate-400" />
      </div>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </button>
  );
}

export function ToggleRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded border border-slate-200 p-3">
      <div>
        <div className="font-semibold">{label}</div>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
      />
    </div>
  );
}

export function ChannelBadge({ channel }: { channel: string }) {
  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold ${channel === "instagram" ? "bg-pink-50 text-pink-700" : "bg-emerald-50 text-emerald-700"}`}
    >
      {channel === "instagram" ? "IG" : "WA"}
    </span>
  );
}

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-slate-100 pb-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="min-w-0 truncate font-medium text-slate-700">{value}</dd>
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="grid min-h-36 place-items-center px-4 py-8 text-center">
      <div>
        <div className="font-semibold text-slate-600">{title}</div>
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      </div>
    </div>
  );
}

export function StatusBanner({
  tone,
  children,
}: {
  tone: "success" | "error" | "warning";
  children: React.ReactNode;
}) {
  const classes =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "error"
        ? "border-red-200 bg-red-50 text-red-800"
        : "border-amber-200 bg-amber-50 text-amber-900";
  return (
    <div
      className={`mb-4 rounded border px-4 py-3 text-sm font-medium ${classes}`}
    >
      {children}
    </div>
  );
}

export function Breadcrumb({
  items,
  onSelectView,
}: {
  items: Array<string | { label: string; view: ViewId }>;
  onSelectView?: (view: ViewId) => void;
}) {
  return (
    <div className="flex items-center gap-2 text-xs text-[#5f86b6]">
      {items.map((item, index) => {
        const label = typeof item === "string" ? item : item.label;
        const view = typeof item === "string" ? undefined : item.view;
        return (
          <span key={`${label}-${index}`} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="size-3 text-slate-400" />}
            {view && onSelectView ? (
              <button
                type="button"
                onClick={() => onSelectView(view)}
                className="hover:underline"
              >
                {label}
              </button>
            ) : (
              label
            )}
          </span>
        );
      })}
    </div>
  );
}

export function emptyStaff(): StaffMember {
  return {
    id: crypto.randomUUID(),
    name: "",
    email: "",
    phone: "",
    role: "Personel",
    onlineBooking: true,
    calendarVisible: true,
  };
}

export function sanitizeStaffMember(member: StaffMember): StaffMember {
  const { color: _color, ...rest } = member as StaffMember & { color?: string };
  return rest;
}

export function emptyService(): ServiceItem {
  return {
    id: crypto.randomUUID(),
    name: "",
    gender: "Unisex",
    duration: 60,
    priceType: "single",
    price: 0,
    minPrice: 0,
    maxPrice: 0,
    staffIds: [],
  };
}

export function parseLooseNumber(value: string) {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatServicePrice(service: ServiceItem) {
  if (service.priceType === "range") {
    return `${service.minPrice || 0} - ${service.maxPrice || 0}`;
  }
  return String(service.price || 0);
}

export function contactToCustomerProfile(contact: ContactRow): CustomerProfile {
  return {
    id: `contact-${contact.id}`,
    name: contact.name,
    countryCode: "+90",
    phone: contact.phone || "",
    email: "",
    birthDate: "",
    gender: "Belirtilmemiş",
    notes: contact.lastMessage || "",
    fileNumber: "",
    instagramUsername: contact.username || "",
    discountEnabled: false,
    discountRate: 0,
    tags: [],
  };
}

export function isNavSubGroup(item: NavItem | NavSubGroup): item is NavSubGroup {
  return "children" in item;
}

export function getAllNavItems(): NavItem[] {
  return [
    ...primaryNav,
    ...navGroups.flatMap((group) =>
      group.children.flatMap((item) =>
        isNavSubGroup(item) ? item.children : [item],
      ),
    ),
    ...setupItems,
    { id: "subscription", label: "Üyelik", icon: ShoppingBag },
    { id: "invoice/list", label: "Faturalar", icon: FileText },
  ];
}

export function getViewLabel(view: ViewId) {
  return getAllNavItems().find((item) => item.id === view)?.label || view;
}

export function normalizeView(value: string | null): ViewId | null {
  if (!value) return null;
  const ids = new Set<ViewId>(getAllNavItems().map((item) => item.id));
  return ids.has(value as ViewId) ? (value as ViewId) : null;
}

export function normalizeHash(hash: string): ViewId | null {
  const value = hash.replace(/^#\//, "") as ViewId;
  return normalizeView(value);
}

export function normalizeHoursObject(hours: unknown): Record<string, string> {
  if (!hours) return {};
  if (typeof hours === "string") {
    try {
      return JSON.parse(hours);
    } catch {
      return {};
    }
  }
  if (typeof hours === "object") return hours as Record<string, string>;
  return {};
}

export function normalizeArray<T = any>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function normalizeObject<T extends Record<string, any> = Record<string, any>>(
  value: unknown,
): T {
  if (value && typeof value === "object" && !Array.isArray(value))
    return value as T;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : ({} as T);
    } catch {
      return {} as T;
    }
  }
  return {} as T;
}

export function isSetupComplete(business: Business) {
  const basics = [
    business.name,
    business.type,
    business.email,
    business.address,
    business.city,
    business.district,
  ];
  const hasBasics = basics.every((value) => !!String(value || "").trim());
  const hasHours = DAYS.every(
    (day) => !!String(business.hours[day.key] || "").trim(),
  );
  return hasBasics && hasHours;
}

export function ensureCompleteHours(hours: Record<string, string>) {
  const next = { ...hours };
  for (const day of DAYS) {
    if (!String(next[day.key] || "").trim()) next[day.key] = "00:00 - 24:00";
  }
  return next;
}

export function parseHourValue(value: string) {
  if (!value || value.toLocaleLowerCase("tr-TR").includes("kapalı")) {
    return { status: value ? "Kapalı" : "Açık", start: "00:00", end: "24:00" };
  }
  const match = value.match(/(\d{2}:\d{2}).*(\d{2}:\d{2})/);
  return {
    status: "Açık",
    start: match?.[1] || "00:00",
    end: match?.[2] || "24:00",
  };
}

export function formatHourValue(status: string, start: string, end: string) {
  return status === "Kapalı" ? "Kapalı" : `${start} - ${end}`;
}

export function buildContacts(
  conversations: Conversation[],
  appointments: Appointment[],
): ContactRow[] {
  const appointmentCounts = new Map<string, number>();
  for (const appointment of appointments) {
    const key = normalizeContactKey(
      appointment.phone || appointment.customerName,
    );
    appointmentCounts.set(key, (appointmentCounts.get(key) || 0) + 1);
  }

  return conversations
    .map((conversation) => {
      const messages = getConversationMessages(conversation);
      const key = normalizeContactKey(
        conversation.customerPhone ||
          conversation.instagramUsername ||
          conversation.customerJid ||
          getContactDisplayName(conversation),
      );
      return {
        id: conversation.id,
        name: getContactDisplayName(conversation),
        subtitle: getContactSubtitle(conversation) || "",
        channel: conversation.channel || "whatsapp",
        phone: conversation.customerPhone || "",
        username: conversation.instagramUsername || "",
        updatedAt: conversation.updatedAt,
        messageCount: messages.length,
        appointmentCount: appointmentCounts.get(key) || 0,
        lastMessage: messages.at(-1)?.text || "",
        conversation,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.updatedAt || 0).getTime() -
        new Date(a.updatedAt || 0).getTime(),
    );
}

export function getConversationMessages(
  conversation: Conversation,
): Array<{ role: string; text: string }> {
  if (!conversation) return [];
  let raw = conversation.messages;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(raw)) return [];
  return raw
    .map((message: any) => ({
      role: message.role || "assistant",
      text: getMessageText(message),
    }))
    .filter((message) => message.text.trim());
}

export function getMessageText(message: any): string {
  if (!message) return "";
  if (typeof message === "string") return message;
  if (Array.isArray(message.parts))
    return message.parts.map((part: any) => part.text || "").join("\n");
  return message.content || message.text || "";
}

export function normalizeContactKey(value: string) {
  return value.toLocaleLowerCase("tr-TR").replace(/[^\d\p{L}@._-]/gu, "");
}

export function formatLastUpdate(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const now = new Date();
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const target = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
  const time = date.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (target === today) return time;
  if (target === today - 24 * 60 * 60 * 1000) return `Dün ${time}`;
  return `${date.toLocaleDateString("tr-TR")} ${time}`;
}

export function formatDateLong(value: string) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  });
}

export function formatInputDate(value: string) {
  if (!value) return "-";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function getWhatsAppInstanceStatus(instance: any) {
  if (!instance) return null;
  return (
    instance.connectionStatus ||
    instance.status ||
    instance.instance?.status ||
    null
  );
}

export function getEvolutionInstanceName(instance: any) {
  return (
    instance?.name ||
    instance?.instance?.instanceName ||
    instance?.instanceName ||
    ""
  );
}
