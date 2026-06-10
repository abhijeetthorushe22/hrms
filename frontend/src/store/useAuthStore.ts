import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useEffect, useState } from "react";
import { authApi } from "@/lib/api";
import { api } from "@/lib/axios";

export type UserRole = "admin" | "manager" | "recruiter" | "employee";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  employee_id?: string;
  created_at?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User, token: string) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        const attemptLogin = async (isRetry = false) => {
          try {
            const response = await authApi.login({ email, password });
            const user: User = {
              id: response.user.id,
              email: response.user.email,
              role: response.user.role as UserRole,
              employee_id: response.user.employee_id,
              created_at: response.user.created_at,
            };

            set({
              user,
              token: response.access_token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            // Ensure token is available for immediate API calls after login
            api.defaults.headers.common.Authorization = `Bearer ${response.access_token}`;
          } catch (error: any) {
            const statusCode = error.response?.status;

            // 503 = server is warming up (Render cold start) — retry once automatically
            if (statusCode === 503 && !isRetry) {
              set({ error: "Server is warming up, retrying..." });
              await new Promise((resolve) => setTimeout(resolve, 2500));
              return attemptLogin(true);
            }

            const errorMessage = error.response?.data?.detail || "Login failed";
            set({
              error: errorMessage,
              isLoading: false,
              isAuthenticated: false,
              user: null,
              token: null,
            });
            throw new Error(errorMessage);
          }
        };

        await attemptLogin();
      },

      register: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const user = await authApi.register({ email, password });
          // After registration, automatically log in
          await get().login(email, password);
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.detail || "Registration failed";
          set({
            error: errorMessage,
            isLoading: false,
          });
          throw new Error(errorMessage);
        }
      },

      logout: () => {
        delete api.defaults.headers.common.Authorization;
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      setUser: (user: User, token: string) => {
        set({ user, token, isAuthenticated: true, error: null });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          api.defaults.headers.common.Authorization = `Bearer ${state.token}`;
        }
      },
    }
  )
);

/** Wait for persisted auth state to load from localStorage before routing. */
export function useAuthHydrated() {
  const [hydrated, setHydrated] = useState(() =>
    useAuthStore.persist.hasHydrated()
  );

  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useAuthStore.persist.hasHydrated());
    return unsub;
  }, []);

  return hydrated;
}
