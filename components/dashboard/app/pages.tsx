"use client";

import { Business, ContactRow, PlaceholderPage, SetupViewId, ViewId } from "./shared";
import { OverviewPage } from "./overview";
import { CalendarPage, AppointmentsPage } from "./calendar";
import { CheckoutsPage } from "./checkouts";
import { ContactsPage } from "./customers";
import { PackageSalesPage, ProductSalesPage } from "./sales";
import { FinancePage } from "./finance";
import { ReportPage } from "./reports";
import { AccountPage } from "./account";
import { AutomaticMessagesPage, MessagingPage, ReminderRepliesPage, WhatsappRegisterPage } from "./whatsapp";
import { InstagramMessagesPage } from "./instagram";
import { SetupPage } from "./setup";

export function ContentRouter({
  view,
  business,
  selectedDate,
  onDateChange,
  contacts,
  selectedContact,
  searchTerm,
  saving,
  whatsAppStatus,
  qrCodeBase64,
  onChange,
  onHourChange,
  onSave,
  onUpdateAndSave,
  onSelectView,
  onSelectContact,
  onTogglePatch,
  onReconnectWhatsApp,
  onDisconnectWhatsApp,
}: {
  view: ViewId;
  business: Business;
  selectedDate: string;
  onDateChange: (date: string) => void;
  contacts: ContactRow[];
  selectedContact: ContactRow | null;
  searchTerm: string;
  saving: boolean;
  whatsAppStatus: string | null;
  qrCodeBase64: string | null;
  onChange: <K extends keyof Business>(field: K, value: Business[K]) => void;
  onHourChange: (dayKey: string, value: string, field: "start" | "end") => void;
  onSave: () => void;
  onUpdateAndSave: (fields: Partial<Business>) => Promise<boolean>;
  onSelectView: (view: ViewId) => void;
  onSelectContact: (id: string) => void;
  onTogglePatch: (field: "is_active" | "test_mode", value: boolean) => void;
  onReconnectWhatsApp: () => void;
  onDisconnectWhatsApp: () => void;
}) {
  if (view === "dashboard") {
    return (
      <OverviewPage
        business={business}
        contacts={contacts}
        onUpdateAndSave={onUpdateAndSave}
        onSelectView={onSelectView}
      />
    );
  }
  if (view === "calendar")
    return (
      <CalendarPage
        selectedDate={selectedDate}
        business={business}
        appointments={business.appointments || []}
        calendarId={business.calendarId || ""}
        contacts={contacts}
        saving={saving}
        onDateChange={onDateChange}
        onUpdateAndSave={onUpdateAndSave}
        onSelectView={onSelectView}
      />
    );
  if (view === "booking/list") {
    return <AppointmentsPage appointments={business.appointments || []} />;
  }
  if (view === "visit/list") {
    return (
      <CheckoutsPage
        business={business}
        contacts={contacts}
        saving={saving}
        onUpdateAndSave={onUpdateAndSave}
      />
    );
  }
  if (view === "client/list") {
    return (
      <ContactsPage
        business={business}
        contacts={contacts}
        searchTerm={searchTerm}
        saving={saving}
        onUpdateAndSave={onUpdateAndSave}
      />
    );
  }
  if (view === "product_sale/list") {
    return (
      <ProductSalesPage
        business={business}
        saving={saving}
        onUpdateAndSave={onUpdateAndSave}
      />
    );
  }
  if (view === "package_sale/list") {
    return (
      <PackageSalesPage
        business={business}
        saving={saving}
        onUpdateAndSave={onUpdateAndSave}
      />
    );
  }
  if (view.startsWith("report/")) {
    return <ReportPage view={view} business={business} />;
  }
  if (view.startsWith("other/")) {
    return (
      <FinancePage
        view={view}
        business={business}
        saving={saving}
        onUpdateAndSave={onUpdateAndSave}
      />
    );
  }
  if (view === "subscription" || view === "invoice/list") {
    return <AccountPage view={view} business={business} />;
  }
  if (view === "messaging/whatsapp/sent-reminders") {
    return (
      <AutomaticMessagesPage
        contacts={contacts}
        onSelectView={onSelectView}
      />
    );
  }
  if (view === "messaging/whatsapp/register") {
    return (
      <WhatsappRegisterPage
        whatsAppStatus={whatsAppStatus}
        qrCodeBase64={qrCodeBase64}
        saving={saving}
        onReconnectWhatsApp={onReconnectWhatsApp}
      />
    );
  }
  if (view === "messaging/whatsapp/reminder-messages") {
    return (
      <ReminderRepliesPage
        contacts={contacts}
        onSelectView={onSelectView}
      />
    );
  }
  if (view === "messaging/instagram/list") {
    return <InstagramMessagesPage business={business} contacts={contacts} />;
  }
  if (view.startsWith("messaging/")) {
    return (
      <MessagingPage
        view={view}
        business={business}
        contacts={contacts}
        selectedContact={selectedContact}
        onSelectContact={onSelectContact}
      />
    );
  }
  if (view.startsWith("setup/")) {
    return (
      <SetupPage
        view={view as SetupViewId}
        business={business}
        saving={saving}
        whatsAppStatus={whatsAppStatus}
        qrCodeBase64={qrCodeBase64}
        onChange={onChange}
        onHourChange={onHourChange}
        onSave={onSave}
        onUpdateAndSave={onUpdateAndSave}
        onTogglePatch={onTogglePatch}
        onReconnectWhatsApp={onReconnectWhatsApp}
        onDisconnectWhatsApp={onDisconnectWhatsApp}
        onSelectView={onSelectView}
      />
    );
  }
  return <PlaceholderPage view={view} />;
}
