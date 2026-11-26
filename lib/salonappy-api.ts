const API_BASE = "https://web-api.salonappy.com/api";

type FetchOptions = {
  timeoutMs?: number;
  attempts?: number;
};

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export type SalonappyBooking = {
  session: string | number;
  client_name: string;
  client_phone_number?: string;
  date: string;
  time_text?: string;
  status_text?: string;
  service_title?: string;
  [key: string]: unknown;
};

export type SalonappyBookingDetail = {
  details?: {
    client_name?: string;
    client_phone_number?: string;
    date?: string;
    time_text?: string;
    time_text_24?: string;
    notes?: string;
    created_at?: string;
    is_cancelled?: boolean;
    [key: string]: unknown;
  };
  services?: Array<{
    id?: string | number;
    staff_id?: string | number;
    staff_name?: string;
    service_id?: string | number;
    service_text?: string;
    duration?: string | number;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
};

export type SalonappyPackageSale = {
  id: string | number;
  group_id?: string | number;
  is_group?: boolean;
  client_id?: string | number;
  client_name?: string;
  client_phone_number?: string;
  client_phone_number_local?: string;
  date?: string;
  service_id?: string | number;
  service_text?: string;
  quantity?: string | number;
  total_amount?: string | number;
  paid_amount?: string | number;
  seller_id?: string | number;
  seller_text?: string;
  notes?: string;
  created_at?: string;
  created_by?: string;
  type?: string;
  group_items?: SalonappyPackageLine[];
  [key: string]: unknown;
};

export type SalonappyPackageLine = {
  id?: string | number;
  service_id?: string | number;
  service_text?: string;
  quantity?: string | number;
  total_amount?: string | number;
  remaining_usage?: string | number;
  type?: string;
  [key: string]: unknown;
};

export type SalonappyPayment = {
  id: string | number;
  payment_method?: string;
  payment_method_text?: string;
  amount?: string | number;
  date?: string;
  created_at?: string;
  [key: string]: unknown;
};

function salonappyHeaders(): HeadersInit {
  const token = process.env.SALONAPPY_TOKEN;
  if (!token) throw new Error("Salonappy token is not configured");
  return {
    accept: "application/json, text/plain, */*",
    authorization: `Bearer ${token}`,
    origin: "https://webapp.salonappy.com",
    referer: "https://webapp.salonappy.com/",
    "x-language": "en",
    "x-platform": "web",
    "x-product": "sappy",
    "x-version": "2026.10.23.1",
    "x-device": "yE9CuHrHGQOKyLqwhfj463lwcOmqdscy",
  };
}

async function fetchJson<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const attempts = options.attempts ?? 3;
  let lastError = "Salonappy istek limiti veya geçersiz yanıt";
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: salonappyHeaders(),
        signal: AbortSignal.timeout(options.timeoutMs ?? 30000),
        cache: "no-store",
      });
      if (response.status === 429) {
        const retryAfter = Number(response.headers.get("retry-after"));
        const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
          ? Math.min(retryAfter * 1000, 30000)
          : Math.min(8000 * 2 ** attempt + Math.random() * 500, 30000);
        lastError = "Salonappy istek limiti";
        await sleep(waitMs);
        continue;
      }
      const text = await response.text();
      if (!text.trimStart().startsWith("{")) {
        lastError = "Salonappy geçersiz yanıt";
        await sleep(Math.min(2000 * 2 ** attempt + Math.random() * 300, 10000));
        continue;
      }
      if (response.status >= 500) {
        lastError = `Salonappy HTTP ${response.status}`;
        await sleep(Math.min(2000 * 2 ** attempt + Math.random() * 300, 10000));
        continue;
      }
      if (response.status !== 200) {
        throw new Error(`Salonappy HTTP ${response.status}`);
      }
      return JSON.parse(text) as T;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Salonappy HTTP")) {
        throw error;
      }
      lastError = error instanceof Error ? error.message : "Salonappy isteği başarısız";
      if (attempt < attempts - 1) {
        await sleep(Math.min(2000 * 2 ** attempt + Math.random() * 300, 10000));
      }
    }
  }
  throw new Error(lastError);
}

export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  const run = async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  };
  const size = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: size }, () => run()));
  return results;
}

export async function fetchCurrentBookings(
  dateStart: string,
): Promise<SalonappyBooking[]> {
  const rows: SalonappyBooking[] = [];
  let offset = 0;
  for (let page = 0; page < 20; page += 1) {
    const url = `${API_BASE}/booking/list?offset=${offset}&limit=500&date_start=${dateStart}&date_end=2027-12-31&status=`;
    const json = await fetchJson<{
      data?: { bookings?: SalonappyBooking[]; total_records?: number };
    }>(url);
    const pageRows = json.data?.bookings;
    if (!Array.isArray(pageRows)) throw new Error("Randevu listesi alınamadı");
    rows.push(...pageRows);
    offset += pageRows.length;
    const total = Number(json.data?.total_records) || 0;
    if (pageRows.length === 0 || (total > 0 && rows.length >= total)) break;
  }
  return rows;
}

export async function fetchBookingDetails(
  sessions: string[],
): Promise<Record<string, SalonappyBookingDetail>> {
  const pairs = await mapWithConcurrency(sessions, 2, async (session) => {
    const url = `${API_BASE}/booking/detail?session=${encodeURIComponent(session)}`;
    const json = await fetchJson<{
      status: number;
      data?: { booking?: SalonappyBookingDetail };
    }>(url);
    await sleep(350);
    if (json.status !== 1 || !json.data?.booking) return null;
    return { session, detail: json.data.booking };
  });
  const result: Record<string, SalonappyBookingDetail> = {};
  for (const pair of pairs) {
    if (pair) result[pair.session] = pair.detail;
  }
  return result;
}

export async function fetchRecentPackageSales(
  dateStart: string,
  dateEnd: string,
): Promise<SalonappyPackageSale[]> {
  const rows: SalonappyPackageSale[] = [];
  let offset = 0;
  for (let page = 0; page < 20; page += 1) {
    const url = `${API_BASE}/package_sale/list_v2?offset=${offset}&limit=500&date_start=${dateStart}&date_end=${dateEnd}`;
    const json = await fetchJson<{
      status: number;
      data?: {
        package_sales?: SalonappyPackageSale[];
        total_records?: number;
      };
    }>(url);
    if (json.status !== 1 || !Array.isArray(json.data?.package_sales)) {
      throw new Error("Paket satış listesi alınamadı");
    }
    const pageRows = json.data.package_sales;
    rows.push(...pageRows);
    offset += pageRows.length;
    const total = Number(json.data.total_records) || 0;
    if (pageRows.length === 0 || (total > 0 && rows.length >= total)) break;
  }
  return rows.filter(
    (row) => row.is_valid !== false && !(row as { deleted_at?: unknown }).deleted_at,
  );
}

export async function fetchAllPackageSales(): Promise<SalonappyPackageSale[]> {
  const rows: SalonappyPackageSale[] = [];
  let offset = 0;
  for (let page = 0; page < 60; page += 1) {
    const url = `${API_BASE}/package_sale/list_v2?offset=${offset}&limit=500`;
    const json = await fetchJson<{
      status: number;
      data?: {
        package_sales?: SalonappyPackageSale[];
        total_records?: number;
      };
    }>(url);
    if (json.status !== 1 || !Array.isArray(json.data?.package_sales)) {
      throw new Error("Paket satış listesi alınamadı");
    }
    const pageRows = json.data.package_sales;
    rows.push(...pageRows);
    offset += pageRows.length;
    const total = Number(json.data.total_records) || 0;
    if (pageRows.length === 0 || (total > 0 && rows.length >= total)) break;
    await sleep(300);
  }
  return rows.filter(
    (row) => row.is_valid !== false && !(row as { deleted_at?: unknown }).deleted_at,
  );
}

export async function fetchPackagePayments(
  groupIds: string[],
): Promise<Record<string, { totalPayment: number; payments: SalonappyPayment[] }>> {
  const pairs = await mapWithConcurrency(groupIds, 2, async (groupId) => {
    const url = `${API_BASE}/package_sale/payments_v2?package_sale_group_id=${encodeURIComponent(groupId)}`;
    const json = await fetchJson<{
      status: number;
      data?: { total_payment?: number; payments?: SalonappyPayment[] };
    }>(url);
    await sleep(350);
    if (json.status !== 1 || !json.data) return null;
    return {
      groupId,
      totalPayment: Number(json.data.total_payment) || 0,
      payments: Array.isArray(json.data.payments) ? json.data.payments : [],
    };
  });
  const result: Record<string, { totalPayment: number; payments: SalonappyPayment[] }> = {};
  for (const pair of pairs) {
    if (pair) result[pair.groupId] = pair;
  }
  return result;
}
