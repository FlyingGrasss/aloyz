import type { AppointmentStatus } from "@/domain/models";

export function istanbulDate(value = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

export function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00+03:00`);
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Istanbul",
  }).format(date);
}

export function appointmentStatusLabel(status: AppointmentStatus) {
  const labels: Record<string, string> = {
    REQUESTED: "Onay bekliyor",
    CONFIRMED: "Onaylandı",
    COMPLETED: "Tamamlandı",
    CANCELED: "İptal edildi",
  };
  return labels[status] || status;
}

export function statusTone(status: AppointmentStatus) {
  if (status === "CONFIRMED" || status === "COMPLETED") return "success" as const;
  if (status === "REQUESTED") return "warning" as const;
  if (status === "CANCELED") return "danger" as const;
  return "neutral" as const;
}
