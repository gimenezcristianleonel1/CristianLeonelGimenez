"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, ApiClientError } from "@/lib/api-client";

export type CustomerProfile = {
  id: number;
  name: string;
  whatsapp: string;
  email: string | null;
  address: string | null;
};

type CustomerAuthContextValue = {
  customer: CustomerProfile | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const CustomerAuthContext = createContext<CustomerAuthContextValue>({
  customer: null,
  loading: true,
  refresh: async () => {},
  logout: async () => {},
});

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<{ customer: CustomerProfile }>("/api/me");
      setCustomer(data.customer);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        setCustomer(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await api.post("/api/customer-auth/logout");
    setCustomer(null);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <CustomerAuthContext.Provider value={{ customer, loading, refresh, logout }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  return useContext(CustomerAuthContext);
}
