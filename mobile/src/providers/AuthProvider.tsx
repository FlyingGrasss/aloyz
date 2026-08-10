import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import type { SessionUser } from "@/domain/models";
import { authService } from "@/services/authService";

type AuthStatus = "initializing" | "authenticated" | "guest";

type AuthContextValue = {
  status: AuthStatus;
  user: SessionUser | null;
  signIn: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  completeSignIn: (code: string) => Promise<void>;
  signOut: () => Promise<void>;
  restore: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>("initializing");
  const [user, setUser] = useState<SessionUser | null>(null);

  const restore = useCallback(async () => {
    setStatus("initializing");
    const restoredUser = await authService.restoreSession();
    setUser(restoredUser);
    setStatus(restoredUser ? "authenticated" : "guest");
  }, []);

  useEffect(() => {
    void restore();
  }, [restore]);

  const signIn = useCallback(async () => {
    const nextUser = await authService.signInWithGoogle();
    setUser(nextUser);
    setStatus("authenticated");
  }, []);

  const completeSignIn = useCallback(async (code: string) => {
    const nextUser = await authService.exchangeCode(code);
    setUser(nextUser);
    setStatus("authenticated");
  }, []);

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const nextUser = await authService.signInWithPassword(email, password);
    setUser(nextUser);
    setStatus("authenticated");
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setUser(null);
    setStatus("guest");
  }, []);

  const value = useMemo(
    () => ({ status, user, signIn, signInWithPassword, completeSignIn, signOut, restore }),
    [completeSignIn, restore, signIn, signInWithPassword, signOut, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider.");
  return value;
}
