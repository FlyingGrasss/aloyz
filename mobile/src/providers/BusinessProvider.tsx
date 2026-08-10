import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import type { Business } from "@/domain/models";
import { ApiError } from "@/services/apiClient";
import { businessService } from "@/services/businessService";

type BusinessContextValue = {
  business: Business | null;
  loading: boolean;
  error: string | null;
  errorCode: string | null;
  refresh: () => Promise<void>;
  save: (fields: Partial<Business>) => Promise<Business>;
};

const BusinessContext = createContext<BusinessContextValue | null>(null);

export function BusinessProvider({ children }: PropsWithChildren) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    setErrorCode(null);
    try {
      setBusiness(await businessService.getCurrent());
    } catch (caught) {
      setBusiness(null);
      setError(caught instanceof Error ? caught.message : "İşletme bilgileri alınamadı.");
      setErrorCode(caught instanceof ApiError ? caught.code ?? null : null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = useCallback(async (fields: Partial<Business>) => {
    const saved = await businessService.save(fields);
    await refresh();
    return saved;
  }, [refresh]);

  const value = useMemo(
    () => ({ business, loading, error, errorCode, refresh, save }),
    [business, error, errorCode, loading, refresh, save],
  );

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}

export function useBusiness() {
  const value = useContext(BusinessContext);
  if (!value) throw new Error("useBusiness must be used within BusinessProvider.");
  return value;
}
