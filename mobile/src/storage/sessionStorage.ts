import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const SESSION_TOKEN_KEY = "aloyz.mobile.session-token";
let fallbackToken: string | null = null;

async function canUseSecureStore() {
  return Platform.OS !== "web" && SecureStore.isAvailableAsync();
}

export const sessionStorage = {
  async getToken() {
    if (await canUseSecureStore()) {
      return SecureStore.getItemAsync(SESSION_TOKEN_KEY);
    }
    return fallbackToken;
  },

  async setToken(token: string) {
    if (await canUseSecureStore()) {
      await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED,
      });
      return;
    }
    fallbackToken = token;
  },

  async clearToken() {
    if (await canUseSecureStore()) {
      await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
    }
    fallbackToken = null;
  },
};
