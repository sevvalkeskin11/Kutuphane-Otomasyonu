import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { setUnauthorizedHandler } from "../services/apiFetch.js";

const AuthContext = createContext(null);

const TOKEN_KEY = "token";
const USER_KEY = "user";

function readUserFromStorage() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function readTokenFromStorage() {
  const value = localStorage.getItem(TOKEN_KEY);
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => readTokenFromStorage());
  const [user, setUser] = useState(() => readUserFromStorage());

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      navigate("/giris", {
        replace: true,
        state: {
          from: {
            pathname: window.location.pathname,
            search: window.location.search,
          },
        },
      });
    });
    return () => setUnauthorizedHandler(null);
  }, [logout, navigate]);

  // Sekmeler arası senkron: bir sekmede çıkış yapılırsa diğeri de güncellensin.
  useEffect(() => {
    function handleStorage(event) {
      if (event.key === TOKEN_KEY) {
        setToken(readTokenFromStorage());
      }
      if (event.key === USER_KEY) {
        setUser(readUserFromStorage());
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const login = useCallback((nextUser, nextToken) => {
    if (nextToken) {
      localStorage.setItem(TOKEN_KEY, nextToken);
      setToken(nextToken);
    }
    if (nextUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      setUser(nextUser);
    }
  }, []);

  const updateUser = useCallback((patch) => {
    setUser((prev) => {
      const next = { ...(prev || {}), ...(patch || {}) };
      localStorage.setItem(USER_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      isAdmin: user?.role === "admin",
      login,
      logout,
      updateUser,
    }),
    [user, token, login, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth, <AuthProvider> içinde kullanılmalıdır.");
  }
  return ctx;
}

export default AuthContext;
