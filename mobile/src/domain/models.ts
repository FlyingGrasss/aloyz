export type UserRole = "admin" | "business";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: UserRole;
  approvalStatus: ApprovalStatus | string;
};

export type AppointmentStatus =
  | "REQUESTED"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELED"
  | string;

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
  status: AppointmentStatus;
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

export type BreakHourItem = {
  id: string;
  label: string;
  start: string;
  end: string;
  days: string[];
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
  lines?: Array<Record<string, unknown>>;
  duration: number;
  amount: number;
  discount: number;
  attendance?: "Belirtilmemiş" | "Geldi" | "Gelmedi";
  payments?: Array<Record<string, unknown>>;
  status: string;
  createdAt: string;
};

export type ProductCatalogItem = { id: string; name: string; barcode: string; price: number };
export type PackageCatalogItem = { id: string; name: string; type: string; serviceId: string; quantity: number; price: number };
export type ProductSaleLine = { id: string; productId: string; name: string; quantity: number; amount: number };
export type PackageSaleLine = { id: string; packageId: string; name: string; packageType: string; serviceId: string; quantity: number; amount: number };
export type ProductSaleItem = { id: string; customerId?: string; date: string; customerName: string; sellerId: string; notes: string; lines: ProductSaleLine[]; paid: boolean; total: number; paidAmount: number; createdBy: string; createdAt: string };
export type PackageSaleItem = { id: string; customerId?: string; date: string; customerName: string; sellerId: string; notes: string; lines: PackageSaleLine[]; hasExpiry: boolean; openPaymentWindow: boolean; createReceivable: boolean; total: number; paidAmount: number; createdBy: string; createdAt: string };
export type ExpenseItem = { id: string; date: string; category: string; title: string; amount: number; paymentMethod: string; status: string; notes: string; createdAt: string };
export type PaymentItem = { id: string; date: string; customerId?: string; customerName: string; amount: number; method: string; source: string; notes: string; createdAt: string };
export type LedgerItem = { id: string; date: string; customerId?: string; personName: string; amount: number; paidAmount: number; description: string; status: string; reminderSentAt?: string; createdAt: string };
export type CommissionItem = { id: string; date: string; staffId: string; source: string; amount: number; status: string };
export type SpecialWorkingHourItem = { id: string; valid_from: string; valid_until: string; working_hours: Record<string, string>; staffIds: string[]; title?: string; date?: string; open?: boolean; start?: string; end?: string };
export type ClientTagItem = { id: string; name: string; color: string; discountRate: number };

export type PromotionsSettings = Record<string, unknown> & {
  products?: ProductCatalogItem[];
  packages?: PackageCatalogItem[];
  productSales?: ProductSaleItem[];
  packageSales?: PackageSaleItem[];
  expenses?: ExpenseItem[];
  payments?: PaymentItem[];
  receivables?: LedgerItem[];
  debts?: LedgerItem[];
  commissions?: CommissionItem[];
  specialWorkingHours?: SpecialWorkingHourItem[];
  tags?: ClientTagItem[];
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
  bookingSettings: Record<string, unknown>;
  botSettings: Record<string, unknown> & { hasAccessTill?: string };
  special_instructions: string | null;
  is_active: boolean;
  test_mode: boolean;
  instagram_page_id: string | null;
  currentMembershipRole?: "owner" | "employee";
  memberships?: Array<Record<string, unknown>>;
  conversations: Conversation[];
  appointments: Appointment[];
};

export type PublicBookingData = {
  business: Pick<
    Business,
    | "id"
    | "name"
    | "slug"
    | "type"
    | "phone"
    | "email"
    | "city"
    | "district"
    | "address"
    | "website"
    | "hours"
    | "bookingSettings"
    | "services"
    | "staff"
  > & { hasCalendar: boolean };
  dates: Array<{ value: string; label: string }>;
  slots: string[];
  slotStaff: Record<string, string[]>;
  selected: { date: string; serviceId: string; staffId: string };
};
