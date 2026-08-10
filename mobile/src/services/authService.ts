import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import type { SessionUser } from "@/domain/models";
import { apiClient, API_BASE_URL } from "@/services/apiClient";
import { sessionStorage } from "@/storage/sessionStorage";

WebBrowser.maybeCompleteAuthSession();

type ExchangeResponse = {
  accessToken: string;
  expiresAt: string;
  user: SessionUser;
};

type NativeGoogleModule = {
  GoogleSignin: {
    configure(options: { webClientId: string; offlineAccess?: boolean }): void;
    hasPlayServices(options?: { showPlayServicesUpdateDialog?: boolean }): Promise<boolean>;
    signIn(): Promise<{ type?: string; data?: { idToken?: string } }>;
    signOut(): Promise<unknown>;
  };
};

function getNativeGoogleModule(): NativeGoogleModule | null {
  if (Platform.OS === "web") return null;
  try {
    // This package contains native code and is intentionally loaded lazily so
    // Expo Go can keep using the browser fallback.
    return require("@react-native-google-signin/google-signin") as NativeGoogleModule;
  } catch {
    return null;
  }
}

async function exchangeCode(code: string) {
  const exchange = await apiClient.post<ExchangeResponse>(
    "/api/mobile/auth/exchange",
    { code },
    false,
  );
  await sessionStorage.setToken(exchange.accessToken);
  return exchange.user;
}

export const authService = {
  async restoreSession() {
    const token = await sessionStorage.getToken();
    if (!token) return null;
    try {
      const response = await apiClient.get<{ user: SessionUser }>(
        "/api/mobile/auth/session",
      );
      return response.user;
    } catch {
      await sessionStorage.clearToken();
      return null;
    }
  },

  async signInWithGoogle() {
    const nativeGoogle = getNativeGoogleModule();
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
    if (nativeGoogle && webClientId) {
      nativeGoogle.GoogleSignin.configure({ webClientId, offlineAccess: false });
      await nativeGoogle.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const result = await nativeGoogle.GoogleSignin.signIn();
      const idToken = result.data?.idToken;
      if (!idToken) throw new Error("Google kimlik doğrulaması tamamlanamadı.");

      const response = await apiClient.post<ExchangeResponse>(
        "/api/mobile/auth/google",
        { idToken },
        false,
      );
      await sessionStorage.setToken(response.accessToken);
      return response.user;
    }

    const redirectUri = Linking.createURL("auth/callback");
    const callbackPath = `/mobile/auth/callback?redirectUri=${encodeURIComponent(redirectUri)}`;
    const loginUrl = `${API_BASE_URL}/login?callbackUrl=${encodeURIComponent(callbackPath)}`;
    const result = await WebBrowser.openAuthSessionAsync(loginUrl, redirectUri);

    if (result.type !== "success") {
      throw new Error(result.type === "cancel" ? "Giriş iptal edildi." : "Giriş tamamlanamadı.");
    }

    const resultUrl = new URL(result.url);
    const remoteError = resultUrl.searchParams.get("error");
    const code = resultUrl.searchParams.get("code");
    if (remoteError || !code) {
      throw new Error("Google oturumu doğrulanamadı.");
    }

    return exchangeCode(code);
  },

  async signInWithPassword(email: string, password: string) {
    const response = await apiClient.post<ExchangeResponse>(
      "/api/mobile/auth/password",
      { email, password },
      false,
    );
    await sessionStorage.setToken(response.accessToken);
    return response.user;
  },

  exchangeCode,

  async signOut() {
    try {
      const nativeGoogle = getNativeGoogleModule();
      if (nativeGoogle) await nativeGoogle.GoogleSignin.signOut().catch(() => undefined);
      await apiClient.delete<void>("/api/mobile/auth/session");
    } finally {
      await sessionStorage.clearToken();
    }
  },
};
