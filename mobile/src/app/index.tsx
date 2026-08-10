import { Redirect } from "expo-router";
import { LoadingState, Screen } from "@/components/ui";
import { useAuth } from "@/providers/AuthProvider";

export default function IndexScreen() {
  const { status } = useAuth();
  if (status === "initializing") {
    return (
      <Screen>
        <LoadingState label="Oturum kontrol ediliyor..." />
      </Screen>
    );
  }
  return <Redirect href={status === "authenticated" ? "/(app)" : "/login"} />;
}
