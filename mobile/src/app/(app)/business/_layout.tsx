import { Stack } from "expo-router";
import { colors } from "@/theme/tokens";

export default function BusinessStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="profile" options={{ title: "İşletme bilgileri" }} />
      <Stack.Screen name="hours" options={{ title: "Çalışma saatleri" }} />
      <Stack.Screen name="onboarding" options={{ title: "İşletme oluştur" }} />
    </Stack>
  );
}
