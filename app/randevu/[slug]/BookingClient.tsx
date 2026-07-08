"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, MapPin, Phone, UserRound, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type BookingBusiness = {
  name: string;
  slug: string;
  type: string;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  district?: string | null;
  address?: string | null;
  website?: string | null;
  hasCalendar: boolean;
  services: Array<{
    id: string;
    name: string;
    gender?: string;
    duration?: number;
    priceType?: "single" | "range";
    price?: number;
    minPrice?: number;
    maxPrice?: number;
    staffIds?: string[];
  }>;
  staff: Array<{
    id: string;
    name: string;
    role?: string;
  }>;
};

type BookingData = {
  business: BookingBusiness;
  dates: Array<{ value: string; label: string }>;
  slots: string[];
  slotStaff?: Record<string, string[]>;
  selected: {
    date: string;
    serviceId: string;
    staffId: string;
  };
};

const ANY_STAFF = "any";

function formatPrice(service: BookingBusiness["services"][number]) {
  if (service.priceType === "range") {
    return `${service.minPrice || 0} - ${service.maxPrice || 0} TL`;
  }
  return service.price ? `${service.price} TL` : "Fiyat işletmede";
}

export default function BookingClient({ slug }: { slug: string }) {
  const [data, setData] = useState<BookingData | null>(null);
  const [serviceId, setServiceId] = useState("");
  const [staffId, setStaffId] = useState(ANY_STAFF);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    date: string;
    time: string;
    staffName?: string;
    status: string;
  } | null>(null);

  const service = useMemo(
    () => data?.business.services.find((item) => item.id === serviceId) || null,
    [data, serviceId],
  );
  const staffOptions = useMemo(() => {
    if (!data) return [];
    if (!service?.staffIds?.length) return data.business.staff;
    return data.business.staff.filter((member) =>
      service.staffIds?.includes(member.id),
    );
  }, [data, service]);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (serviceId) params.set("serviceId", serviceId);
      if (staffId) params.set("staffId", staffId);
      if (date) params.set("date", date);
      try {
        const res = await fetch(`/api/public/booking/${encodeURIComponent(slug)}?${params}`, {
          signal: controller.signal,
        });
        const next = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(next.error || "Randevu sayfası yüklenemedi.");
          return;
        }
        setData(next);
        setServiceId((current) => current || next.selected.serviceId || "");
        setStaffId((current) => current || next.selected.staffId || ANY_STAFF);
        setDate((current) => current || next.selected.date || "");
        setTime("");
      } catch (err: any) {
        if (err?.name !== "AbortError") setError("Randevu sayfası yüklenemedi.");
      } finally {
        setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [slug, serviceId, staffId, date]);

  useEffect(() => {
    if (staffId === ANY_STAFF) return;
    if (!staffOptions.some((member) => member.id === staffId)) {
      setStaffId(ANY_STAFF);
    }
  }, [staffOptions, staffId]);

  async function submitBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!serviceId || !date || !time) {
      setError("Lütfen hizmet, tarih ve saat seçin.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/public/booking/${encodeURIComponent(slug)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          staffId,
          date,
          time,
          customerName,
          phone,
          note,
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(result.error || "Randevu oluşturulamadı.");
        return;
      }
      setSuccess({
        date: result.appointment.date,
        time: result.appointment.time,
        staffName: result.appointment.staffName,
        status: result.appointment.status,
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading && !data) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
        <div className="text-sm font-semibold text-slate-500">Randevu sayfası yükleniyor...</div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
        <div className="max-w-md rounded-lg border border-red-200 bg-white p-5 text-sm font-semibold text-red-700">
          {error || "Randevu sayfası bulunamadı."}
        </div>
      </main>
    );
  }

  const { business } = data;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-xs font-bold uppercase text-slate-400">Aloyz Randevu</div>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">{business.name}</h1>
              <p className="mt-1 text-sm text-slate-500">{business.type}</p>
            </div>
            <div className="grid gap-2 text-sm text-slate-600 sm:text-right">
              {(business.city || business.district || business.address) && (
                <div className="flex items-center gap-2 sm:justify-end">
                  <MapPin className="size-4" />
                  {[business.address, business.district, business.city].filter(Boolean).join(", ")}
                </div>
              )}
              {business.phone && (
                <div className="flex items-center gap-2 sm:justify-end">
                  <Phone className="size-4" />
                  {business.phone}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <form onSubmit={submitBooking} className="mx-auto grid max-w-5xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-5">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-bold">Hizmet seçin</h2>
            <div className="mt-3 grid gap-2">
              {business.services.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setServiceId(item.id);
                    setStaffId(ANY_STAFF);
                  }}
                  className={`grid gap-1 rounded-lg border p-3 text-left transition ${
                    serviceId === item.id
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <span className="font-semibold">{item.name}</span>
                  <span className={serviceId === item.id ? "text-slate-200" : "text-slate-500"}>
                    {item.duration || 30} dk · {formatPrice(item)}
                  </span>
                </button>
              ))}
              {business.services.length === 0 && (
                <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  Bu işletme henüz online randevu için hizmet eklememiş.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-base font-bold">Personel seçin</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {staffOptions.length > 0 && (
                <button
                  type="button"
                  onClick={() => setStaffId(ANY_STAFF)}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-left transition ${
                    staffId === ANY_STAFF
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <UsersRound className="size-5" />
                  <span>
                    <span className="block font-semibold">Fark etmez</span>
                    <span className={staffId === ANY_STAFF ? "text-slate-200" : "text-slate-500"}>
                      Müsait olan personel
                    </span>
                  </span>
                </button>
              )}
              {staffOptions.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setStaffId(member.id)}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-left transition ${
                    staffId === member.id
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <UserRound className="size-5" />
                  <span>
                    <span className="block font-semibold">{member.name}</span>
                    <span className={staffId === member.id ? "text-slate-200" : "text-slate-500"}>
                      {member.role || "Personel"}
                    </span>
                  </span>
                </button>
              ))}
            </div>
            {staffOptions.length === 0 && (
              <div className="mt-3 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Bu hizmet için online randevuya uygun personel bulunamadı.
              </div>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <CalendarDays className="size-5" />
              Tarih seçin
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {data.dates.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setDate(item.value)}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                    date === item.value
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <Clock3 className="size-5" />
              Saat seçin
            </h2>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {data.slots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setTime(slot)}
                  className={`rounded-lg border px-3 py-2 text-sm font-bold transition ${
                    time === slot
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
            {!loading && data.slots.length === 0 && (
              <div className="mt-3 rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                Bu tarih için uygun saat bulunamadı. Başka bir tarih deneyin.
              </div>
            )}
          </div>
        </section>

        <aside className="h-fit rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-4">
          {success ? (
            <div className="grid gap-3 text-center">
              <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
              <h2 className="text-xl font-bold">Randevu alındı</h2>
              <p className="text-sm text-slate-600">
                {success.date} saat {success.time} için randevunuz oluşturuldu.
              </p>
              {success.staffName && (
                <p className="text-sm font-semibold text-slate-700">
                  Personel: {success.staffName}
                </p>
              )}
              <p className="rounded border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
                İşletme randevunuzu panelinde görecek.
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-base font-bold">Bilgileriniz</h2>
              <div className="mt-4 grid gap-3">
                <label className="grid gap-1 text-sm font-semibold">
                  Ad soyad
                  <Input
                    required
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    placeholder="Adınız ve soyadınız"
                  />
                </label>
                <label className="grid gap-1 text-sm font-semibold">
                  Telefon
                  <Input
                    required
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="+90..."
                  />
                </label>
                <label className="grid gap-1 text-sm font-semibold">
                  Not
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="İsteğe bağlı"
                    className="min-h-24 rounded-lg border border-neutral-300 bg-white px-2.5 py-2 text-sm shadow-sm outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/20"
                  />
                </label>
              </div>

              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                <div className="font-bold">Özet</div>
                <div className="mt-2 text-slate-600">
                  {service?.name || "Hizmet seçilmedi"} · {date || "Tarih"} {time || "Saat"}
                </div>
                <div className="mt-1 text-slate-500">
                  Personel:{" "}
                  {staffId === ANY_STAFF
                    ? "Fark etmez"
                    : staffOptions.find((member) => member.id === staffId)?.name || "Seçilmedi"}
                </div>
              </div>

              {error && (
                <div className="mt-3 rounded border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={saving || !business.services.length || !staffOptions.length}
                className="mt-4 h-10 w-full bg-slate-900 text-white hover:bg-slate-800"
              >
                {saving ? "Oluşturuluyor..." : "Randevu al"}
              </Button>

              {!business.hasCalendar && (
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Bu işletmede Google Takvim bağlı değil. Randevu Aloyz paneline kaydedilir.
                </p>
              )}
            </>
          )}
        </aside>
      </form>
    </main>
  );
}
