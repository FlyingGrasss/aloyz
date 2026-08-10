import { Stack } from "expo-router";
import { colors } from "@/theme/tokens";

export default function FeatureStackLayout() {
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text, headerShadowVisible: false }}>
      <Stack.Screen name="[view]" options={{ title: "Dashboard" }} />
    </Stack>
  );
}
