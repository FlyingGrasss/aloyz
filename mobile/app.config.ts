import type { ExpoConfig } from "expo/config";

/**
 * Keep the checked-in app.json as the source of the public app metadata while
 * allowing EAS to inject the iOS Google OAuth URL scheme per environment.
 */
export default function appConfig({ config }: { config: ExpoConfig }): ExpoConfig {
  const iosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME?.trim();
  if (!iosUrlScheme) return config;

  return {
    ...config,
    plugins: (config.plugins || []).map((plugin) =>
      plugin === "@react-native-google-signin/google-signin"
        ? [plugin, { iosUrlScheme }]
        : plugin,
    ),
  } as ExpoConfig;
}
