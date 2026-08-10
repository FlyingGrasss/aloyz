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
  checkouts: Array<Record<string, unknown>>;
  promotions: Record<string, unknown>;
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
