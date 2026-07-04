/* ═══════════════════════════════════════════════════════════════
   HYBRID Telescope Control — Internationalization Engine
   v1.0 — Supports EN, FR, ES, DE
   ═══════════════════════════════════════════════════════════════ */

const I18N = (() => {
  let translations = {};
  let currentLang = localStorage.getItem('hybrid-lang') || 'en';

  // Language metadata
  const LANGUAGES = {
    en: { name: 'English',  flag: '🇬🇧', dir: 'ltr' },
    fr: { name: 'Français', flag: '🇫🇷', dir: 'ltr' },
    es: { name: 'Español',  flag: '🇪🇸', dir: 'ltr' },
    de: { name: 'Deutsch',  flag: '🇩🇪', dir: 'ltr' }
  };

  // Detect which page we're on
  function getPageId() {
    const path = window.location.pathname;
    if (path.endsWith('index.html') || path.endsWith('/') || path === '') return 'index';
    const match = path.match(/\/(\d+)-/);
    if (match) return match[1];
    return 'index';
  }

  // Load translation file for a language
  async function loadLanguage(lang) {
    try {
      const resp = await fetch(`translations/${lang}.json`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      translations[lang] = await resp.json();
    } catch (e) {
      console.warn(`[i18n] Failed to load translations/${lang}.json:`, e);
      if (lang !== 'en') {
        // Fallback to English
        try {
          const resp = await fetch('translations/en.json');
          if (resp.ok) translations[lang] = await resp.json();
        } catch (e2) {
          console.error('[i18n] English fallback also failed:', e2);
        }
      }
    }
  }

  // Get a translation string by dot-notation key
  // e.g. t('index.masthead.edition')
  function t(key) {
    const lang = currentLang;
    if (!translations[lang]) return null;
    const keys = key.split('.');
    let val = translations[lang];
    for (const k of keys) {
      if (val && typeof val === 'object' && k in val) {
        val = val[k];
      } else {
        // Fallback to English
        if (lang !== 'en' && translations.en) {
          let fallback = translations.en;
          for (const fk of keys) {
            if (fallback && typeof fallback === 'object' && fk in fallback) {
              fallback = fallback[fk];
            } else { return null; }
          }
          return fallback;
        }
        return null;
      }
    }
    return val;
  }

  // Apply all translations to the DOM
  function applyTranslations() {
    const page = getPageId();
    const lang = currentLang;

    // 1. Apply data-i18n attribute elements (textContent)
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = t(`${page}.${key}`) || t(`common.${key}`) || t(key);
      if (val !== null && val !== undefined) {
        el.textContent = val;
      }
    });

    // 2. Apply data-i18n-html attribute elements (innerHTML — for bold, links, etc.)
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      const val = t(`${page}.${key}`) || t(`common.${key}`) || t(key);
      if (val !== null && val !== undefined) {
        el.innerHTML = val;
      }
    });

    // 3. Apply data-i18n-placeholder attribute elements
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const val = t(`${page}.${key}`) || t(`common.${key}`) || t(key);
      if (val !== null && val !== undefined) {
        el.placeholder = val;
      }
    });

    // 4. Apply data-i18n-title attribute elements
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      const val = t(`${page}.${key}`) || t(`common.${key}`) || t(key);
      if (val !== null && val !== undefined) {
        el.title = val;
      }
    });

    // 5. Update HTML lang attribute
    document.documentElement.lang = lang;

    // 6. Update all language switcher buttons active state
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    // 7. Update the language label display
    const langLabel = document.getElementById('current-lang-label');
    if (langLabel && LANGUAGES[lang]) {
      langLabel.textContent = LANGUAGES[lang].flag + ' ' + LANGUAGES[lang].name;
    }

    // Dispatch event for other scripts
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
  }

  // Switch to a new language
  async function setLanguage(lang) {
    if (!LANGUAGES[lang]) return;
    if (!translations[lang]) await loadLanguage(lang);
    currentLang = lang;
    localStorage.setItem('hybrid-lang', lang);
    applyTranslations();
  }

  // Get current language
  function getLanguage() { return currentLang; }

  // Get all available languages
  function getLanguages() { return LANGUAGES; }

  // Build language switcher HTML
  function buildSwitcher(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let html = '<div class="lang-switcher">';
    html += '<button class="lang-btn active" data-lang="en" title="English">🇬🇧 EN</button>';
    html += '<button class="lang-btn" data-lang="fr" title="Français">🇫🇷 FR</button>';
    html += '<button class="lang-btn" data-lang="es" title="Español">🇪🇸 ES</button>';
    html += '<button class="lang-btn" data-lang="de" title="Deutsch">🇩🇪 DE</button>';
    html += '</div>';

    container.innerHTML = html;

    // Bind click handlers
    container.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        setLanguage(btn.dataset.lang);
      });
    });
  }

  // Initialize on DOM ready
  async function init() {
    // Load current language (and English as fallback)
    await Promise.all([
      loadLanguage('en'),
      loadLanguage(currentLang)
    ]);

    // Build any switchers
    document.querySelectorAll('[data-lang-switcher]').forEach(el => {
      buildSwitcher(el.id || 'lang-switcher');
    });

    // Apply translations
    applyTranslations();
  }

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public API
  return { t, setLanguage, getLanguage, getLanguages, buildSwitcher, applyTranslations, init };
})();
