import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import fr from "./locales/fr.json";
import en from "./locales/en.json";

function readSavedLanguage() {
  try {
    return localStorage.getItem("campus-life:language");
  } catch (error) {
    console.error("Could not read the language preference from localStorage.", error);
    if (typeof window !== "undefined")
      window.dispatchEvent(new Event("campus-life:storage-error"));
    return null;
  }
}

function saveLanguage(language) {
  try {
    localStorage.setItem("campus-life:language", language);
  } catch (error) {
    console.error("Could not save the language preference to localStorage.", error);
    if (typeof window !== "undefined")
      window.dispatchEvent(new Event("campus-life:storage-error"));
  }
}

const savedLanguage = readSavedLanguage();
const initialLanguage =
  savedLanguage === "en" || savedLanguage === "fr" ? savedLanguage : "fr";
if (savedLanguage !== initialLanguage)
  saveLanguage(initialLanguage);

i18n.use(initReactI18next).init({
  resources: { fr: { translation: fr }, en: { translation: en } },
  lng: initialLanguage,
  fallbackLng: "fr",
  supportedLngs: ["fr", "en"],
  interpolation: { escapeValue: false },
});

i18n.on("languageChanged", (language) => {
  if (language === "fr" || language === "en") {
    saveLanguage(language);
    document.documentElement.lang = language;
  }
});

document.documentElement.lang = initialLanguage;

export default i18n;
