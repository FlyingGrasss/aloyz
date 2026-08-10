import { useEffect, useState } from "react";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { Button, LoadingState, MessageState, Screen } from "@/components/ui";
import { useAuth } from "@/providers/AuthProvider";

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{ code?: string | string[]; error?: string | string[] }>();
  const router = useRouter();
  const code = Array.isArray(params.code) ? params.code[0] : params.code;
  const remoteError = Array.isArray(params.error) ? params.error[0] : params.error;
  const { status, completeSignIn } = useAuth();
  const [error, setError] = useState<string | null>(remoteError || null);

  useEffect(() => {
    if (!code || status === "authenticated") return;
    void completeSignIn(code).catch((caught) => {
      setError(caught instanceof Error ? caught.message : "Giriş tamamlanamadı.");
    });
  }, [code, completeSignIn, status]);

  if (status === "authenticated") return <Redirect href="/(app)" />;
  if (error || (!code && status === "guest")) {
    return (
      <Screen>
        <MessageState
          title="Giriş tamamlanamadı"
          message={error || "Giriş kodu bulunamadı."}
          action={<Button onPress={() => router.replace("/login")} variant="secondary">Giriş ekranına dön</Button>}
        />
      </Screen>
    );
  }
  return (
    <Screen>
      <LoadingState label="Giriş tamamlanıyor..." />
    </Screen>
  );
}
