"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "ID" | "EN";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (idText: string, enText: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "ID",
  setLang: () => {},
  t: (idText) => idText,
});

export function getCookieLang(): Language | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )rc_lang=([^;]*)/);
  if (match && (match[1] === "ID" || match[1] === "EN")) {
    return match[1] as Language;
  }
  return null;
}

export function getBrowserLang(): Language {
  if (typeof navigator === "undefined") return "ID";
  const navLang = (navigator.language || (navigator.languages && navigator.languages[0]) || "").toLowerCase();
  return navLang.startsWith("id") ? "ID" : "EN";
}

export function setCookieLang(lang: Language) {
  if (typeof document === "undefined") return;
  document.cookie = `rc_lang=${lang}; path=/; max-age=31536000; SameSite=Lax`;
  try {
    localStorage.setItem("rc_lang", lang);
  } catch (e) {
    // ignore
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("ID");

  useEffect(() => {
    let currentLang = getCookieLang();
    if (!currentLang) {
      currentLang = getBrowserLang();
      setCookieLang(currentLang);
    }
    setLangState(currentLang);

    const handleLangChange = (e: Event) => {
      const customEvent = e as CustomEvent<Language>;
      if (customEvent.detail && (customEvent.detail === "ID" || customEvent.detail === "EN")) {
        setLangState(customEvent.detail);
      } else {
        const updated = getCookieLang() || getBrowserLang();
        setLangState(updated);
      }
    };

    window.addEventListener("rc_lang_change", handleLangChange);
    return () => window.removeEventListener("rc_lang_change", handleLangChange);
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    setCookieLang(newLang);
    window.dispatchEvent(new CustomEvent("rc_lang_change", { detail: newLang }));
  };

  const t = (idText: string, enText: string) => {
    return lang === "ID" ? idText : enText;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
