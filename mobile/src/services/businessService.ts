import type { Appointment, AppointmentStatus, Business } from "@/domain/models";
import { apiClient } from "@/services/apiClient";

export const businessService = {
  getCurrent() {
    return apiClient.get<Business>("/api/business");
  },

  save(fields: Partial<Business>) {
    return apiClient.post<Business>("/api/business", fields);
  },

  patchStatus(fields: Pick<Partial<Business>, "is_active" | "test_mode" | "calendarId">) {
    return apiClient.patch<Business>("/api/business", fields);
  },

  updateAppointmentStatus(id: string, status: AppointmentStatus) {
    return apiClient.patch<{ appointment: Appointment }>(
      `/api/appointments/${encodeURIComponent(id)}`,
      { status },
    );
  },

  onboard(input: { name: string; type: string; phone: string; instagram: string }) {
    return apiClient.post<{ business: Business; approvalStatus: string }>(
      "/api/onboarding/business",
      input,
    );
  },
};
