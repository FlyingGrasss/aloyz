import type { PublicBookingData } from "@/domain/models";
import { apiClient } from "@/services/apiClient";

export type BookingRequest = {
  serviceId: string;
  staffId: string;
  date: string;
  time: string;
  customerName: string;
  phone: string;
  note: string;
};

export const bookingService = {
  get(slug: string, selection?: Partial<Pick<BookingRequest, "serviceId" | "staffId" | "date">>) {
    const params = new URLSearchParams();
    if (selection?.serviceId) params.set("serviceId", selection.serviceId);
    if (selection?.staffId) params.set("staffId", selection.staffId);
    if (selection?.date) params.set("date", selection.date);
    const query = params.size ? `?${params.toString()}` : "";
    return apiClient.get<PublicBookingData>(
      `/api/public/booking/${encodeURIComponent(slug)}${query}`,
      false,
    );
  },

  create(slug: string, input: BookingRequest) {
    return apiClient.post<{
      appointment: {
        id: string;
        date: string;
        time: string;
        staffId: string;
        staffName: string;
        status: string;
        calendarSynced: boolean;
      };
    }>(`/api/public/booking/${encodeURIComponent(slug)}`, input, false);
  },
};
