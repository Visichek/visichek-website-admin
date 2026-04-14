import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { adminApi } from "@/lib/api";

interface Admin {
  id: string;
  full_name: string;
  email: string;
  mfa_enabled?: boolean;
}

export type LoginResult =
  | { kind: "authenticated" }
  | { kind: "otp_required"; otp_challenge_id: string; email: string };

interface AuthContextType {
  admin: Admin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  verifyLoginOtp: (otp_challenge_id: string, otp_code: string) => Promise<void>;
  refreshMe: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await adminApi.getMe();
      if (response?.data) {
        setAdmin(response.data);
      } else {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      }
    } catch (error: any) {
      console.error("Auth check failed:", error?.message || error);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setAdmin(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<LoginResult> => {
    const response = await adminApi.login(email, password);
    const data = response.data;
    if (data?.otp_required && data?.otp_challenge_id) {
      return {
        kind: "otp_required",
        otp_challenge_id: data.otp_challenge_id,
        email: data.email ?? email,
      };
    }
    setAdmin(data);
    return { kind: "authenticated" };
  };

  const verifyLoginOtp = async (otp_challenge_id: string, otp_code: string) => {
    const response = await adminApi.verifyLoginOtp(otp_challenge_id, otp_code);
    setAdmin(response.data);
  };

  const refreshMe = async () => {
    const response = await adminApi.getMe();
    if (response?.data) setAdmin(response.data);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setAdmin(null);
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        isAuthenticated: !!admin,
        isLoading,
        login,
        verifyLoginOtp,
        refreshMe,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
