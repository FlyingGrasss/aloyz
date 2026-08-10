import type { PropsWithChildren } from "react";
import { useRouter } from "expo-router";
import { Button, LoadingState, MessageState, Screen } from "@/components/ui";
import { useBusiness } from "@/providers/BusinessProvider";

export function BusinessGate({ children }: PropsWithChildren) {
  const router = useRouter();
  const { business, loading, error, errorCode, refresh } = useBusiness();
  if (loading) return <Screen><LoadingState label="İşletme bilgileri yükleniyor..." /></Screen>;
  if (!business) {
    const pending = errorCode === "APPROVAL_PENDING";
    const noBusiness = errorCode === "NO_BUSINESS";
    return (
      <Screen>
        <MessageState
          title={pending ? "Hesabınız onay bekliyor" : noBusiness ? "İşletme kurulumu gerekli" : "İşletme bilgileri alınamadı"}
          message={error || "Lütfen bağlantınızı kontrol edip yeniden deneyin."}
          action={
            noBusiness ? (
              <Button onPress={() => router.push("/business/onboarding")}>İşletme oluştur</Button>
            ) : (
              <Button onPress={() => void refresh()} variant="secondary">Yeniden dene</Button>
            )
          }
        />
      </Screen>
    );
  }
  return children;
}
