"use client";

import type React from "react";
import { useEffect, useState } from "react";
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
  LogOut,
  Menu,
  MessageCircle,
  MessagesSquare,
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
import {
  getContactDisplayName,
  getContactSubtitle,
} from "@/lib/contactDisplay";

export type ViewId =
  | "dashboard"
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
  | "setup/products"
  | "setup/service_packages"
  | "setup/booking_settings"
  | "setup/tag_settings"
  | "setup/salon-bot-settings"
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
  eventId?: string;
  customerName: string;
  phone: string;
  date: string;
  time: string;
  serviceId?: string | null;
  staffId?: string | null;
  description: string;
  status: string;
  source?: string | null;
  createdAt: string;
};

export type StaffMember = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  accessRole?: "owner" | "employee";
  onlineBooking: boolean;
  calendarVisible: boolean;
  workingHours?: Record<string, string>;
  breakHours?: BreakHourItem[];
  commissionRate?: number;
  commissionNotes?: string;
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
  customerId?: string;
  customerName: string;
  date: string;
  hour: string;
  minute: string;
  notes: string;
  staffId: string;
  serviceId: string;
  lines?: CheckoutServiceLine[];
  duration: number;
  amount: number;
  discount: number;
  attendance?: "Belirtilmemiş" | "Geldi" | "Gelmedi";
  payments?: CheckoutPayment[];
  status: string;
  createdAt: string;
};

export type CheckoutServiceLine = {
  id: string;
  staffId: string;
  serviceId: string;
  duration: number;
  amount: number;
  merged?: boolean;
};

export type CheckoutPayment = {
  id: string;
  date: string;
  amount: number;
  method: string;
};

export type PromotionsSettings = {
  cashReward: string;
  cardReward: string;
  rewardUsage: string;
  birthdayDiscount: string;
  onlineBookingDiscount: string;
  products?: ProductCatalogItem[];
  packages?: PackageCatalogItem[];
  productSales?: ProductSaleItem[];
  packageSales?: PackageSaleItem[];
  expenses?: ExpenseItem[];
  payments?: PaymentItem[];
  receivables?: LedgerItem[];
  debts?: LedgerItem[];
  reviews?: ReviewItem[];
  callLogs?: CallLogItem[];
  commissions?: CommissionItem[];
  specialWorkingHours?: SpecialWorkingHourItem[];
  tags?: ClientTagItem[];
  audiences?: AudienceItem[];
};

export type BreakHourItem = {
  id: string;
  label: string;
  start: string;
  end: string;
  days: string[];
};

export type ProductCatalogItem = {
  id: string;
  name: string;
  barcode: string;
  price: number;
};

export type PackageCatalogItem = {
  id: string;
  name: string;
  type: string;
  serviceId: string;
  quantity: number;
  price: number;
};

export type ProductSaleLine = {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  amount: number;
};

export type ProductSaleItem = {
  id: string;
  customerId?: string;
  date: string;
  customerName: string;
  sellerId: string;
  notes: string;
  lines: ProductSaleLine[];
  paid: boolean;
  total: number;
  paidAmount: number;
  createdBy: string;
  createdAt: string;
};

export type PackageSaleLine = {
  id: string;
  packageId: string;
  name: string;
  packageType: string;
  serviceId: string;
  quantity: number;
  amount: number;
};

export type PackageSaleItem = {
  id: string;
  customerId?: string;
  date: string;
  customerName: string;
  sellerId: string;
  notes: string;
  lines: PackageSaleLine[];
  hasExpiry: boolean;
  openPaymentWindow: boolean;
  createReceivable: boolean;
  total: number;
  paidAmount: number;
  createdBy: string;
  createdAt: string;
};

export type ExpenseItem = {
  id: string;
  date: string;
  category: string;
  title: string;
  amount: number;
  paymentMethod: string;
  status: string;
  notes: string;
  createdAt: string;
};

export type PaymentItem = {
  id: string;
  date: string;
  customerId?: string;
  customerName: string;
  amount: number;
  method: string;
  source: string;
  notes: string;
  createdAt: string;
};

export type LedgerItem = {
  id: string;
  date: string;
  customerId?: string;
  personName: string;
  amount: number;
  paidAmount: number;
  description: string;
  status: string;
  reminderSentAt?: string;
  createdAt: string;
};

export type ReviewItem = {
  id: string;
  date: string;
  customerId?: string;
  customerName: string;
  rating: number;
  channel: string;
  comment: string;
  status: string;
};

export type CallLogItem = {
  id: string;
  date: string;
  customerId?: string;
  customerName: string;
  phone: string;
  direction: string;
  result: string;
  notes: string;
};

export type CommissionItem = {
  id: string;
  date: string;
  staffId: string;
  source: string;
  amount: number;
  status: string;
};

export type SpecialWorkingHourItem = {
  id: string;
  valid_from: string;
  valid_until: string;
  working_hours: Record<string, string>;
  staffIds: string[];
  title?: string;
  date?: string;
  open?: boolean;
  start?: string;
  end?: string;
};

export type ClientTagItem = {
  id: string;
  name: string;
  color: string;
  discountRate: number;
};

export type AudienceItem = {
  id: string;
  name: string;
  channel: string;
  filter: string;
  size: number;
  status: string;
  createdAt: string;
};

export type BookingSettings = {
  interval: string;
  timeFormat: string;
  cancellation: boolean;
  reminder: boolean;
  calendarView?: string;
  calendarWidth?: string;
  calendarSlotInterval?: string;
  calendarTextColor?: string;
  breakHours?: BreakHourItem[];
};

export type BotSettings = {
  instagram: boolean;
  whatsapp: boolean;
  instagramConnected?: boolean;
  instagramUsername?: string;
  instagramProfilePicture?: string;
  whatsappConnected?: boolean;
  active?: boolean;
  hasAccessTill?: string;
};

export type Business = {
  id: string;
  createdAt?: string;
  updatedAt?: string;
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
  currentMembershipRole?: "owner" | "employee";
  memberships?: Array<{
    id: string;
    role: string;
    status: string;
    user?: {
      id: string;
      name: string | null;
      email: string;
      image?: string | null;
      approvalStatus?: string | null;
    };
  }>;
  conversations: Conversation[];
  appointments: Appointment[];
};

export type NavItem = {
  id: ViewId;
  label: string;
  icon: LucideIcon;
  iconClassName?: string;
  beta?: boolean;
};

export type NavGroup = {
  key: string;
  label: string;
  icon: LucideIcon;
  iconClassName?: string;
  children: Array<NavItem | NavSubGroup>;
  beta?: boolean;
};

export type NavSubGroup = {
  key: string;
  label: string;
  icon: LucideIcon;
  iconClassName?: string;
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

export const WhatsAppBrandIcon = ((props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path
      fill="currentColor"
      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
    />
  </svg>
)) as LucideIcon;

export const InstagramBrandIcon = ((props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
    <path
      fill="currentColor"
      d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"
    />
  </svg>
)) as LucideIcon;

export const mainSetupItems: NavItem[] = [
  { id: "setup/general", label: "Bilgileri", icon: Info },
  { id: "setup/working-hours", label: "Çalışma saatleri", icon: Settings },
  { id: "setup/staff", label: "Personeller", icon: Users },
  { id: "setup/services", label: "Hizmetler", icon: List },
  { id: "setup/service_durations", label: "Hizmet süreleri", icon: Clock3 },
  {
    id: "setup/service_prices",
    label: "Hizmet fiyatları",
    icon: CircleDollarSign,
  },
  {
    id: "setup/booking_settings",
    label: "Randevu ayarları",
    icon: CalendarDays,
  },
  {
    id: "setup/salon-bot-settings",
    label: "Bot Ayarları",
    icon: MessageCircle,
  },
  {
    id: "setup/connections",
    label: "Bağlantılar / Entegrasyonlar",
    icon: LinkIcon,
  },
];

export const advancedSetupItems: NavItem[] = [
  {
    id: "setup/special-working-hours",
    label: "Dönemsel çalışma saatleri",
    icon: CalendarDays,
  },
  { id: "setup/products", label: "Ürünler", icon: Tag },
  { id: "setup/service_packages", label: "Paketler", icon: Package },
  { id: "setup/tag_settings", label: "Etiket ayarları", icon: Tag },
];

export const setupItems: NavItem[] = [...mainSetupItems, ...advancedSetupItems];

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
        id: "messaging/whatsapp/sent-reminders",
        label: "Tüm Mesajlar",
        icon: MessagesSquare,
      },
      {
        key: "messaging-whatsapp",
        label: "WhatsApp",
        icon: WhatsAppBrandIcon,
        iconClassName: "text-[#25D366]",
        children: [
          {
            id: "messaging/whatsapp/register",
            label: "WP Kurulumu",
            icon: WhatsAppBrandIcon,
            iconClassName: "text-[#25D366]",
          },
          {
            id: "messaging/whatsapp/list",
            label: "Mesajlar",
            icon: WhatsAppBrandIcon,
            iconClassName: "text-[#25D366]",
          },
        ],
      },
      {
        key: "messaging-instagram",
        label: "Instagram",
        icon: InstagramBrandIcon,
        iconClassName: "text-pink-500",
        children: [
          {
            id: "messaging/instagram/setup",
            label: "IG Kurulumu",
            icon: InstagramBrandIcon,
            iconClassName: "text-pink-500",
          },
          {
            id: "messaging/instagram/list",
            label: "Mesajlar",
            icon: InstagramBrandIcon,
            iconClassName: "text-pink-500",
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
  { label: "Yeni tahsilat", icon: WalletCards },
  { label: "Yeni alacak", icon: ReceiptText },
  { label: "Yeni borç", icon: BriefcaseBusiness },
  { label: "Yeni komisyon", icon: CircleDollarSign },
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
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("tr");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState({
    appointments: true,
    messages: true,
    payments: true,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const nextDarkMode = localStorage.getItem("aloyz-theme") === "dark";
    document.documentElement.classList.toggle("dark", nextDarkMode);
    setDarkMode(nextDarkMode);
    setLanguage(localStorage.getItem("aloyz-language") || "tr");
    const savedPrefs = localStorage.getItem("aloyz-notifications");
    if (savedPrefs) {
      try {
        setNotificationPrefs({
          appointments: true,
          messages: true,
          payments: true,
          ...JSON.parse(savedPrefs),
        });
      } catch {
        setNotificationPrefs({
          appointments: true,
          messages: true,
          payments: true,
        });
      }
    }
  }, []);

  function applyTheme(nextDarkMode: boolean) {
    setDarkMode(nextDarkMode);
    document.documentElement.classList.toggle("dark", nextDarkMode);
    localStorage.setItem("aloyz-theme", nextDarkMode ? "dark" : "light");
  }

  function applyLanguage(nextLanguage: string) {
    setLanguage(nextLanguage);
    document.documentElement.lang = nextLanguage;
    document.documentElement.dataset.language = nextLanguage;
    localStorage.setItem("aloyz-language", nextLanguage);
    window.dispatchEvent(
      new CustomEvent("aloyz-language-change", { detail: nextLanguage }),
    );
  }

  async function changePassword() {
    setPasswordMessage("");
    if (!currentPassword || !newPassword || !repeatPassword) {
      setPasswordMessage("Tüm şifre alanlarını doldurun.");
      return;
    }
    if (newPassword !== repeatPassword) {
      setPasswordMessage("Yeni şifreler eşleşmiyor.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage("Yeni şifre en az 8 karakter olmalı.");
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPasswordMessage(data.error || "Şifre değiştirilemedi.");
        return;
      }
      setPasswordMessage("Şifre güncellendi.");
      setCurrentPassword("");
      setNewPassword("");
      setRepeatPassword("");
      window.setTimeout(onClose, 700);
    } finally {
      setPasswordSaving(false);
    }
  }

  function updateNotificationPref(
    key: keyof typeof notificationPrefs,
    checked: boolean,
  ) {
    const next = { ...notificationPrefs, [key]: checked };
    setNotificationPrefs(next);
    localStorage.setItem("aloyz-notifications", JSON.stringify(next));
  }

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
      <section className="w-full max-w-md rounded bg-white shadow-xl dark:bg-slate-900 dark:text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <h2 className="font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="space-y-4 p-4">
          {type === "theme" && (
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                onClick={() => applyTheme(false)}
                className={
                  darkMode
                    ? "bg-white text-slate-800 ring-1 ring-slate-200"
                    : "bg-[#5f86b6] text-white"
                }
              >
                Açık tema
              </Button>
              <Button
                type="button"
                onClick={() => applyTheme(true)}
                className={
                  darkMode
                    ? "bg-[#1f2937] text-white"
                    : "bg-white text-slate-800 ring-1 ring-slate-200"
                }
              >
                Koyu tema
              </Button>
            </div>
          )}
          {type === "language" && (
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                onClick={() => applyLanguage("tr")}
                className={
                  language === "tr"
                    ? "bg-[#5f86b6] text-white"
                    : "bg-white text-slate-800 ring-1 ring-slate-200"
                }
              >
                Türkçe
              </Button>
              <Button
                type="button"
                onClick={() => applyLanguage("en")}
                className={
                  language === "en"
                    ? "bg-[#5f86b6] text-white"
                    : "bg-white text-slate-800 ring-1 ring-slate-200"
                }
              >
                English
              </Button>
            </div>
          )}
          {type === "password" && (
            <div className="grid gap-3">
              <Input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="Mevcut şifre"
              />
              <Input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Yeni şifre"
              />
              <Input
                type="password"
                value={repeatPassword}
                onChange={(event) => {
                  setRepeatPassword(event.target.value);
                  if (newPassword && event.target.value !== newPassword) {
                    setPasswordMessage("Yeni şifreler eşleşmiyor.");
                  } else {
                    setPasswordMessage("");
                  }
                }}
                placeholder="Yeni şifre tekrar"
              />
              {passwordMessage && (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {passwordMessage}
                </p>
              )}
              <Button
                type="button"
                disabled={
                  passwordSaving ||
                  !currentPassword ||
                  !newPassword ||
                  !repeatPassword ||
                  newPassword !== repeatPassword ||
                  newPassword.length < 8
                }
                onClick={changePassword}
                className="bg-[#5f86b6] text-white"
              >
                {passwordSaving ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </div>
          )}
          {type === "notifications" && (
            <div className="grid gap-3">
              <ToggleRow
                label="Randevu bildirimleri"
                description="Yeni randevu ve adisyon güncellemeleri."
                checked={notificationPrefs.appointments}
                onChange={(checked) =>
                  updateNotificationPref("appointments", checked)
                }
              />
              <ToggleRow
                label="Mesaj bildirimleri"
                description="WhatsApp ve Instagram konuşmaları."
                checked={notificationPrefs.messages}
                onChange={(checked) =>
                  updateNotificationPref("messages", checked)
                }
              />
              <ToggleRow
                label="Ödeme bildirimleri"
                description="Tahsilat, alacak ve borç hareketleri."
                checked={notificationPrefs.payments}
                onChange={(checked) =>
                  updateNotificationPref("payments", checked)
                }
              />
            </div>
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
      className={`absolute right-0 top-full z-40 mt-2 rounded-lg border border-slate-200 bg-white shadow-xl shadow-slate-900/10 ${className}`}
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
      className="flex h-9 w-full items-center gap-3 px-3 text-left text-sm text-slate-600 hover:bg-slate-100"
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
  className = "",
  onChange,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
  className?: string;
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className={`h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm disabled:bg-slate-100 ${className}`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
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
      className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold ${
        channel === "instagram"
          ? "bg-pink-50 text-pink-700 dark:bg-pink-500/20 dark:text-pink-100"
          : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100"
      }`}
    >
      {channel === "instagram" ? "IG" : "WP"}
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
    <div className="grid min-h-36 place-items-center rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center">
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
      className={`mb-4 rounded-lg border px-4 py-3 text-sm font-medium shadow-sm ${classes}`}
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
    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
      {items.map((item, index) => {
        const label = typeof item === "string" ? item : item.label;
        const view =
          typeof item === "string"
            ? item === "Aloyz"
              ? "dashboard"
              : undefined
            : item.view;
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
            ) : view === "dashboard" ? (
              <a href="/dashboard?view=dashboard" className="hover:underline">
                {label}
              </a>
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
    accessRole: "employee",
    onlineBooking: true,
    calendarVisible: true,
  };
}

export function sanitizeStaffMember(member: StaffMember): StaffMember {
  const { color: _color, ...rest } = member as StaffMember & { color?: string };
  return {
    ...rest,
    accessRole: rest.accessRole === "owner" ? "owner" : "employee",
  };
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

export function isNavSubGroup(
  item: NavItem | NavSubGroup,
): item is NavSubGroup {
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

export function normalizeObject<
  T extends Record<string, any> = Record<string, any>,
>(value: unknown): T {
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
  return date.toLocaleDateString(getDashboardLocale(), {
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
  return date.toLocaleDateString(getDashboardLocale(), {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getDashboardLocale() {
  if (typeof document === "undefined") return "tr-TR";
  return document.documentElement.dataset.language === "en" ? "en-US" : "tr-TR";
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

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

export function getEvolutionPhoneNumber(instance: unknown) {
  const root = asRecord(instance);
  const nestedInstance = asRecord(root.instance);
  const profile = asRecord(root.profile);
  const nestedProfile = asRecord(nestedInstance.profile);
  const value =
    root.ownerJid ||
    profile.id ||
    profile.wid ||
    nestedInstance.ownerJid ||
    nestedProfile.id ||
    nestedProfile.wid ||
    root.number ||
    root.phone ||
    nestedInstance.number ||
    nestedInstance.phone ||
    "";
  const digits = String(value).split("@")[0].replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("90") ? `+${digits}` : digits;
}
