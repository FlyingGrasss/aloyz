"use client";

import Image from "next/image";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const inviteToken = searchParams.get("inviteToken");
  const googleLabel =
    callbackUrl && !inviteToken ? "Google ile giriş yap" : "Google ile devam et";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const redirectTo = inviteToken
    ? `/invite/accept?token=${encodeURIComponent(inviteToken)}`
    : callbackUrl || "/dashboard";

  function continueWithGoogle() {
    signIn("google", { redirectTo });
  }

  async function continueWithPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordLoading(true);
    setPasswordError("");
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        redirectTo,
      });
      if (!result.ok) {
        setPasswordError("E-posta veya şifre hatalı.");
        return;
      }
      window.location.assign(result.url || redirectTo);
    } catch {
      setPasswordError("Giriş sırasında bir hata oluştu. Lütfen yeniden deneyin.");
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border shadow-lg">
        <CardHeader className="pb-6 text-center">
          <Image
            src="/logo.jpg"
            alt="Aloyz"
            width={52}
            height={52}
            className="mx-auto mb-4 rounded-xl shadow-sm"
          />
          <CardTitle className="text-2xl font-bold tracking-tight">
            Aloyz
          </CardTitle>
          <CardDescription>
            Google hesabınızla veya yöneticinizin oluşturduğu şifreyle giriş yapın.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <form className="space-y-4" onSubmit={continueWithPassword}>
            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="ornek@isletme.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
              />
            </div>
            {passwordError && (
              <p className="text-sm font-medium text-red-600" role="alert">
                {passwordError}
              </p>
            )}
            <Button type="submit" className="h-11 w-full" disabled={passwordLoading}>
              {passwordLoading ? "Giriş yapılıyor..." : "E-posta ile giriş yap"}
            </Button>
          </form>

          <div className="flex items-center gap-3" aria-hidden="true">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium text-muted-foreground">veya</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-11 w-full gap-3 border-slate-300 bg-white font-semibold text-slate-800 hover:bg-slate-50"
            onClick={continueWithGoogle}
          >
            <GoogleLogo />
            {googleLabel}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
