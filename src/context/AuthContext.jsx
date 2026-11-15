// Centralise l'état d'authentification et les actions de session.
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../services/api";
import { AuthContext } from "./authContext";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("checking");
  const [authError, setAuthError] = useState("");
  const initialUserRequestRef = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const result = await api.getCurrentUser();
      setUser(result.user);
      setStatus("authenticated");
      setAuthError("");
      return result.user;
    } catch (error) {
      if (error.statusCode === 401) {
        setUser(null);
        setStatus("anonymous");
        return null;
      }
      setAuthError(error.message);
      setStatus("error");
      throw error;
    }
  }, []);

  const retry = useCallback(async () => {
    setStatus("checking");
    setAuthError("");
    return refresh();
  }, [refresh]);

  useEffect(() => {
    let active = true;
    if (!initialUserRequestRef.current) {
      initialUserRequestRef.current = api.getCurrentUser();
    }
    const request = initialUserRequestRef.current;
    request
      .then((result) => {
        if (!active) return;
        setUser(result.user);
        setStatus("authenticated");
      })
      .catch((error) => {
        if (!active) return;
        if (error.statusCode === 401) {
          setUser(null);
          setStatus("anonymous");
          return;
        }
        setAuthError(error.message);
        setStatus("error");
      })
      .finally(() => {
        if (initialUserRequestRef.current === request) {
          initialUserRequestRef.current = null;
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setStatus("anonymous");
    };
    window.addEventListener("campus-life:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener(
        "campus-life:unauthorized",
        handleUnauthorized,
      );
  }, []);

  const authenticate = useCallback(async (action, credentials) => {
    setAuthError("");
    const result = await api[action](credentials);
    setUser(result.user);
    setStatus("authenticated");
    return result.user;
  }, []);

  const login = useCallback(
    (credentials) => authenticate("login", credentials),
    [authenticate],
  );
  const register = useCallback(
    (credentials) => authenticate("register", credentials),
    [authenticate],
  );
  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
    setStatus("anonymous");
  }, []);
  const changePassword = useCallback(async (passwords) => {
    const result = await api.changePassword(passwords);
    setUser(result.user);
    return result.user;
  }, []);
  const updateUser = useCallback((updates) => {
    setUser((current) => (current ? { ...current, ...updates } : current));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        authError,
        refresh,
        retry,
        login,
        register,
        logout,
        changePassword,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
