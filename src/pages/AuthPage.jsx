// Présente les formulaires de connexion et d'inscription.
import { useState } from "react";
import { GraduationCap } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/useAuth";
import "./AuthPage.css";

export default function AuthPage({ mode }) {
  const isRegister = mode === "register";
  const { t } = useTranslation();
  const { login, register } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const returnTo = location.state?.from;
  const destination =
    typeof returnTo === "string" &&
    returnTo.startsWith("/") &&
    !returnTo.startsWith("//") &&
    !["/login", "/register"].includes(returnTo)
      ? returnTo
      : "/";

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      if (isRegister) {
        await register({ displayName, email, password });
      } else {
        await login({ email, password });
      }
      navigate(destination, { replace: true });
    } catch (requestError) {
      setError(
        requestError.statusCode === 401
          ? t("auth.invalidCredentials")
          : requestError.statusCode === 409
            ? t("auth.emailTaken")
            : t("auth.requestFailed"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="auth-title">
        <Link className="auth-brand" to="/" aria-label={t("app.title")}>
          <span className="topbar-brand-mark">
            <GraduationCap size={25} aria-hidden="true" />
          </span>
          <span>
            campus<span>life</span>
          </span>
        </Link>
        <div className="auth-heading">
          <h1 id="auth-title">
            {t(isRegister ? "auth.registerTitle" : "auth.loginTitle")}
          </h1>
          <p>{t(isRegister ? "auth.registerIntro" : "auth.loginIntro")}</p>
        </div>
        <form className="auth-form" onSubmit={submit}>
          {isRegister && (
            <label>
              <span>{t("auth.displayName")}</span>
              <input
                type="text"
                name="name"
                autoComplete="name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                minLength={1}
                maxLength={80}
                required
              />
            </label>
          )}
          <label>
            <span>{t("auth.email")}</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              maxLength={254}
              required
            />
          </label>
          <label>
            <span>{t("auth.password")}</span>
            <input
              type="password"
              name="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={isRegister ? 12 : 1}
              maxLength={128}
              required
            />
            {isRegister && (
              <small>{t("auth.passwordHelp")}</small>
            )}
          </label>
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          <button
            className="button button-primary auth-submit"
            type="submit"
            disabled={submitting}
          >
            {t(submitting ? "auth.working" : isRegister ? "auth.registerAction" : "auth.loginAction")}
          </button>
        </form>
        <p className="auth-switch">
          {t(isRegister ? "auth.haveAccount" : "auth.needAccount")}{" "}
          <Link to={isRegister ? "/login" : "/register"}>
            {t(isRegister ? "auth.loginLink" : "auth.registerLink")}
          </Link>
        </p>
      </section>
    </main>
  );
}
