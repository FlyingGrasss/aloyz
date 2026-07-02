"use client";

import { useEffect, useMemo, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { InviteShell } from "./InviteShell";

export function InviteAcceptClient() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [message, setMessage] = useState("Davet kontrol ediliyor...");
  const [error, setError] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const callbackUrl = useMemo(() => {
    if (typeof window === "undefined") return "/invite/accept";
    return window.location.href;
  }, []);

  useEffect(() => {
    if (!token) {
      setError("Davet bağlantısı eksik.");
      return;
    }
    if (status === "loading") return;
    if (status === "unauthenticated") {
      setMessage("Daveti kabul etmek için Google hesabınızla giriş yapın.");
      return;
    }
    if (accepting || attempted) return;

    async function acceptInvite() {
      setAccepting(true);
      setAttempted(true);
      setError("");
      setMessage("Davet kabul ediliyor...");
      const res = await fetch("/api/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Davet kabul edilemedi.");
        setAccepting(false);
        return;
      }
      setMessage("Davet kabul edildi. Panele yönlendiriliyorsunuz...");
      router.push(data.redirectTo || "/dashboard");
      router.refresh();
    }

    acceptInvite();
  }, [accepting, attempted, router, status, token]);

  if (status === "unauthenticated" && token) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
        <section className="mx-auto mt-16 w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold">Aloyz daveti</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
          <Button
            type="button"
            className="mt-5 w-full bg-slate-900 text-white"
            onClick={() => signIn("google", { callbackUrl })}
          >
            Google ile devam et
          </Button>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
        <section className="mx-auto mt-16 w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold">Aloyz daveti</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">{error}</p>
          <Button
            type="button"
            variant="outline"
            className="mt-5 w-full"
            onClick={() => {
              setAttempted(false);
              setError("");
            }}
          >
            Tekrar dene
          </Button>
        </section>
      </main>
    );
  }

  return <InviteShell message={message} />;
}
