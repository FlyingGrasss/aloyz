import { Redirect, Tabs } from "expo-router";
import { LoadingState, Screen } from "@/components/ui";
import { BusinessProvider } from "@/providers/BusinessProvider";
import { DashboardChromeProvider } from "@/providers/DashboardChromeProvider";
import { useAuth } from "@/providers/AuthProvider";

export default function AppTabsLayout() {
  const { status } = useAuth();
  if (status === "initializing") {
    return <Screen><LoadingState /></Screen>;
  }
  if (status !== "authenticated") return <Redirect href="/login" />;

  return (
    <BusinessProvider>
      <DashboardChromeProvider>
        <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: "none" } }}>
          <Tabs.Screen name="index" options={{ title: "Özet" }} />
          <Tabs.Screen name="appointments" options={{ title: "Randevular" }} />
          <Tabs.Screen name="customers" options={{ title: "Müşteriler" }} />
          <Tabs.Screen name="more" options={{ title: "Menü" }} />
          <Tabs.Screen name="business" options={{ href: null }} />
          <Tabs.Screen name="feature" options={{ href: null }} />
        </Tabs>
      </DashboardChromeProvider>
    </BusinessProvider>
  );
}
