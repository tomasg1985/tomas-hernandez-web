(function () {
    const SUPPORTED = ['es', 'en'];
    let dict = {};
    let currentLang = 'es';

    function getInitialLang() {
        const fromUrl = new URLSearchParams(location.search).get('lang');
        if (SUPPORTED.includes(fromUrl)) return fromUrl;
        try {
            const saved = localStorage.getItem('lang');
            if (SUPPORTED.includes(saved)) return saved;
        } catch (e) {}
        return navigator.language.startsWith('en') ? 'en' : 'es';
    }

    function apply() {
        // Textos: <li data-i18n="nav.about">
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const text = dict[el.dataset.i18n];
            if (text !== undefined) el.textContent = text;
        });
        // Atributos: data-i18n-attr="aria-label:nav.openMenu"
        document.querySelectorAll('[data-i18n-attr]').forEach(el => {
            el.dataset.i18nAttr.split(';').forEach(pair => {
                const [attr, key] = pair.split(':');
                if (dict[key] !== undefined) el.setAttribute(attr, dict[key]);
            });
        });
        // Marca cuál botón de idioma está activo
        document.querySelectorAll('[data-lang-button]').forEach(button => {
            button.setAttribute('aria-pressed', String(button.dataset.langButton === currentLang));
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const text = dict[el.dataset.i18nPlaceholder];
            if (text !== undefined) el.setAttribute('placeholder', text);
        });
    }

    

    async function setLang(lang) {
        const response = await fetch(`locales/${lang}.json`);
        dict = await response.json();
        currentLang = lang;
        document.documentElement.lang = lang;
        try { localStorage.setItem('lang', lang); } catch (e) {}
        apply();
        window.dispatchEvent(new CustomEvent('languagechange', { detail: { lang } }));
    }

    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('[data-lang-button]').forEach(button => {
            button.addEventListener('click', () => setLang(button.dataset.langButton));
        });
        setLang(getInitialLang());
    });

    window.i18n = { t: key => dict[key] ?? key, getLang: () => currentLang, setLang };
})();