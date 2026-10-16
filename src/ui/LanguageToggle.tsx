/**
 * LT | EN (Stage 11 localization): two small segmented buttons, the language codes only (no flags,
 * no dialog). In the setup bar, so it is hidden with it while the cinematic plays; the store
 * refuses a switch during playback anyway (i18n/language.ts).
 */
import { LANGUAGES, useLanguageStore } from '../i18n/language';
import { useStrings } from '../i18n/strings';

export function LanguageToggle({ className = '' }: { className?: string }) {
  const language = useLanguageStore((s) => s.language);
  const t = useStrings();
  return (
    <div className={`segmented ${className}`.trim()} role="group" aria-label={t.language.group}>
      {LANGUAGES.map((code) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-pressed={language === code}
          title={t.language.names[code]}
          onClick={() => useLanguageStore.getState().setLanguage(code)}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
