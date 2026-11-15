// Configure les langues disponibles et la synchronisation avec les préférences du compte.
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { api } from "../services/api.js";
import fr from "./locales/fr.json";
import en from "./locales/en.json";

const initialLanguage = navigator.language.toLowerCase().startsWith("en")
  ? "en"
  : "fr";

i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr }, en: { translation: en } },
  lng: initialLanguage,
  fallbackLng: "fr",
  supportedLngs: ["fr", "en"],
  interpolation: { escapeValue: false },
});

i18n.on("languageChanged", (language) => {
  if (language === "fr" || language === "en") {
    document.documentElement.lang = language;
    api.updateProfile({ language }).catch((error) => {
      console.error("Could not save the language preference to the API.", error);
      window.dispatchEvent(
        new CustomEvent("campus-life:api-error", { detail: error }),
      );
    });
  }
});

document.documentElement.lang = initialLanguage;

export default i18n;
