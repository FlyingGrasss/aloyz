import crypto from "crypto";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";

type ServiceAccountConfig = {
  clientEmail: string;
  privateKey: string;
};

type GoogleCalendarEventInput = {
  summary: string;
  description?: string;
  start: string;
  end: string;
  checkoutId?: string;
  lineId?: string;
};

function base64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function getServiceAccountConfig(): ServiceAccountConfig {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    const parsed = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    return {
      clientEmail: parsed.client_email,
      privateKey: String(parsed.private_key).replace(/\\n/g, "\n"),
    };
  }

  if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    return {
      clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
      privateKey: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  }

  throw new Error("Google service account credentials are not configured.");
}

export function isGoogleCalendarConfigured() {
  return !!(
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON ||
    (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY)
  );
}

async function getAccessToken() {
  const config = getServiceAccountConfig();
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: config.clientEmail,
    scope: CALENDAR_SCOPE,
    aud: TOKEN_URL,
    exp: now + 3600,
    iat: now,
  };
  const unsigned = `${base64Url(JSON.stringify(header))}.${base64Url(
    JSON.stringify(claim),
  )}`;
  const signature = crypto
    .createSign("RSA-SHA256")
    .update(unsigned)
    .sign(config.privateKey);
  const assertion = `${unsigned}.${base64Url(signature)}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description || data.error || "Token failed");
  }
  return data.access_token as string;
}

async function calendarFetch(calendarId: string, path: string, init?: RequestInit) {
  const token = await getAccessToken();
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId,
    )}${path}`,
    {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error?.message || "Google Calendar request failed");
  }
  return data;
}

export async function listGoogleCalendarEvents({
  calendarId,
  timeMin,
  timeMax,
}: {
  calendarId: string;
  timeMin: string;
  timeMax: string;
}) {
  return calendarFetch(
    calendarId,
    `/events?${new URLSearchParams({
      timeMin,
      timeMax,
      singleEvents: "true",
      orderBy: "startTime",
    }).toString()}`,
  );
}

export async function createGoogleCalendarEvent(
  calendarId: string,
  input: GoogleCalendarEventInput,
) {
  return calendarFetch(calendarId, "/events", {
    method: "POST",
    body: JSON.stringify({
      summary: input.summary,
      description: input.description,
      start: { dateTime: input.start, timeZone: "Europe/Istanbul" },
      end: { dateTime: input.end, timeZone: "Europe/Istanbul" },
      extendedProperties:
        input.checkoutId && input.lineId
          ? {
              private: {
                checkoutId: input.checkoutId,
                checkoutLineKey: `${input.checkoutId}:${input.lineId}`,
              },
            }
          : undefined,
    }),
  });
}

export async function updateGoogleCalendarEvent(
  calendarId: string,
  eventId: string,
  input: GoogleCalendarEventInput,
) {
  return calendarFetch(calendarId, `/events/${encodeURIComponent(eventId)}`, {
    method: "PATCH",
    body: JSON.stringify({
      summary: input.summary,
      description: input.description,
      start: { dateTime: input.start, timeZone: "Europe/Istanbul" },
      end: { dateTime: input.end, timeZone: "Europe/Istanbul" },
      extendedProperties:
        input.checkoutId && input.lineId
          ? {
              private: {
                checkoutId: input.checkoutId,
                checkoutLineKey: `${input.checkoutId}:${input.lineId}`,
              },
            }
          : undefined,
    }),
  });
}
