import { describe, expect, it } from "vitest";
import { languageLocales, languageNames, languages, parseLanguage, translations } from "./i18n";

describe("localized copy", () => {
  it("provides complete non-empty translations for all supported languages", () => {
    const englishKeys = Object.keys(translations.en).sort();

    for (const language of languages) {
      expect(Object.keys(translations[language]).sort()).toEqual(englishKeys);
      expect(Object.values(translations[language]).every((value) => value.length > 0)).toBe(true);
      expect(languageNames[language]).toBeTruthy();
      expect(languageLocales[language]).toBeTruthy();
    }
  });

  it("falls back to English for an unsupported saved language", () => {
    expect(parseLanguage("uz")).toBe("uz");
    expect(parseLanguage(null)).toBe("en");
    expect(parseLanguage("fr")).toBe("en");
  });
});
