import AsyncStorage from "@react-native-async-storage/async-storage";

export type AppPreferences = {
  language: "tr" | "en";
  colorScheme: "light" | "dark" | "system";
};

const PREFERENCES_KEY = "aloyz.mobile.preferences.v1";
const defaults: AppPreferences = { language: "tr", colorScheme: "system" };

export const preferencesStorage = {
  async get(): Promise<AppPreferences> {
    const raw = await AsyncStorage.getItem(PREFERENCES_KEY);
    if (!raw) return defaults;
    try {
      const parsed = JSON.parse(raw) as Partial<AppPreferences>;
      return {
        language: parsed.language === "en" ? "en" : "tr",
        colorScheme:
          parsed.colorScheme === "light" || parsed.colorScheme === "dark"
            ? parsed.colorScheme
            : "system",
      };
    } catch {
      return defaults;
    }
  },

  async set(preferences: AppPreferences) {
    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  },
};
