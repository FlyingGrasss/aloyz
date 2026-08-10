import { Redirect, Tabs } from "expo-router";
import { CalendarDays, LayoutDashboard, Menu, Users } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LoadingState, Screen } from "@/components/ui";
import { BusinessProvider } from "@/providers/BusinessProvider";
import { useAuth } from "@/providers/AuthProvider";
import { colors } from "@/theme/tokens";

export default function AppTabsLayout() {
  const { status } = useAuth();
  const insets = useSafeAreaInsets();
  if (status === "initializing") {
    return <Screen><LoadingState /></Screen>;
  }
  if (status !== "authenticated") return <Redirect href="/login" />;

  return (
    <BusinessProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: { height: 58 + insets.bottom, paddingBottom: insets.bottom, borderTopColor: colors.border, backgroundColor: colors.surface },
          tabBarLabelStyle: { fontSize: 11, fontWeight: "700", marginBottom: 2 },
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Özet", tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} /> }} />
        <Tabs.Screen name="appointments" options={{ title: "Randevular", tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} /> }} />
        <Tabs.Screen name="customers" options={{ title: "Müşteriler", tabBarIcon: ({ color, size }) => <Users color={color} size={size} /> }} />
        <Tabs.Screen name="more" options={{ title: "Menü", tabBarIcon: ({ color, size }) => <Menu color={color} size={size} /> }} />
        <Tabs.Screen name="business" options={{ href: null }} />
        <Tabs.Screen name="feature" options={{ href: null }} />
      </Tabs>
    </BusinessProvider>
  );
}
