// Donne accès au contexte d'authentification depuis les composants.
import { useContext } from "react";
import { AuthContext } from "./authContext";

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
