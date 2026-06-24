export const TRIAL_DAYS = 14;

type AccessSettings = {
  hasAccessTill?: string;
} | null | undefined;

export function defaultAccessTill(createdAtValue?: string | Date | null) {
  const createdAt =
    createdAtValue instanceof Date
      ? createdAtValue
      : createdAtValue
        ? new Date(createdAtValue)
        : new Date();
  const safeCreatedAt = Number.isNaN(createdAt.getTime())
    ? new Date()
    : createdAt;
  const accessTill = new Date(safeCreatedAt);
  accessTill.setDate(accessTill.getDate() + TRIAL_DAYS);
  return accessTill;
}

export function getAccessTill(
  settings: AccessSettings,
  createdAtValue?: string | Date | null,
) {
  if (settings?.hasAccessTill) {
    const explicit = new Date(settings.hasAccessTill);
    if (!Number.isNaN(explicit.getTime())) return explicit;
  }

  return defaultAccessTill(createdAtValue);
}

export function hasDashboardAccess(
  settings: AccessSettings,
  createdAtValue?: string | Date | null,
) {
  return Date.now() <= getAccessTill(settings, createdAtValue).getTime();
}

export function formatAccessInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
