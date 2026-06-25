import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react/src/custom-fetch";
import { useGetMe, User } from "@workspace/api-client-react";

interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("sewa_token"));
  
  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem("sewa_token"));
  }, []);

  const { data: user, isLoading: isLoadingUser } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    }
  });

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("sewa_token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("sewa_token");
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, user: user ?? null, isLoading: isLoadingUser, login, logout }}>
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
