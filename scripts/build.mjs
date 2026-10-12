import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const outputRoot = path.join(projectRoot, 'dist');
const templatePath = path.join(projectRoot, 'index.html');
const locales = ['es', 'de', 'en'];
const languageNames = { es: 'Español', de: 'Deutsch', en: 'English' };
const generatedTranslationKeys = new Set([
    'nav.switchToSpanish',
    'nav.switchToGerman',
    'nav.switchToEnglish',
]);

function flatten(value, prefix = '', result = {}) {
    for (const [key, child] of Object.entries(value)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (child && typeof child === 'object' && !Array.isArray(child)) {
            flatten(child, fullKey, result);
        } else {
            result[fullKey] = child;
        }
    }
    return result;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('"', '&quot;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
}

function siteUrlFor(locale) {
    const base = process.env.SITE_URL?.replace(/\/+$/, '');
    return base ? `${base}/${locale}/` : `../${locale}/`;
}

function labelKey(locale) {
    return { es: 'spanish', de: 'german', en: 'english' }[locale];
}

const template = await readFile(templatePath, 'utf8');
const placeholderKeys = new Set([...template.matchAll(/\{\{([^{}]+)\}\}/g)].map((match) => match[1]));

for (const locale of locales) {
    const dictionaryPath = path.join(projectRoot, 'translations', `${locale}.json`);
    const dictionary = JSON.parse(await readFile(dictionaryPath, 'utf8'));
    const values = flatten(dictionary);
    const alternateLocales = locales.filter((candidate) => candidate !== locale);
    const [firstAlternate, secondAlternate] = alternateLocales;
    Object.assign(values, {
        'meta.urlEs': siteUrlFor('es'),
        'meta.urlDe': siteUrlFor('de'),
        'meta.urlEn': siteUrlFor('en'),
        'meta.canonical': siteUrlFor(locale),
        'meta.languageUrl': siteUrlFor(firstAlternate),
        'meta.languageCode': firstAlternate,
        'meta.languageName': languageNames[firstAlternate],
        'meta.languageLabel': dictionary.nav[`switchTo${labelKey(firstAlternate)[0].toUpperCase()}${labelKey(firstAlternate).slice(1)}`],
        'meta.languageUrl2': siteUrlFor(secondAlternate),
        'meta.languageCode2': secondAlternate,
        'meta.languageName2': languageNames[secondAlternate],
        'meta.languageLabel2': dictionary.nav[`switchTo${labelKey(secondAlternate)[0].toUpperCase()}${labelKey(secondAlternate).slice(1)}`],
    });

    const missing = [...placeholderKeys].filter((key) => !(key in values));
    const unused = Object.keys(values).filter((key) => !placeholderKeys.has(key) && !key.startsWith('meta.') && !generatedTranslationKeys.has(key));
    if (missing.length || unused.length) {
        throw new Error(`${locale}: translation keys do not match the template. Missing: ${missing.join(', ') || 'none'}. Unused: ${unused.join(', ') || 'none'}.`);
    }

    const html = template.replace(/\{\{([^{}]+)\}\}/g, (_, key) => escapeHtml(values[key]));
    if (/\{\{[^{}]+\}\}/.test(html)) {
        throw new Error(`${locale}: unresolved template placeholders remain.`);
    }

    const localeOutput = path.join(outputRoot, locale);
    await mkdir(localeOutput, { recursive: true });
    await writeFile(path.join(localeOutput, 'index.html'), html);
}

for (const entry of ['style.css', 'mediaqueries.css', 'script.js', 'assets']) {
    await cp(path.join(projectRoot, entry), path.join(outputRoot, entry), { recursive: true, force: true });
}

console.log(`Built ${locales.map((locale) => `/${locale}/`).join(' and ')} in dist/.`);
if (!process.env.SITE_URL) {
    console.log('For production SEO URLs, set SITE_URL to the public origin before building (for example: SITE_URL=https://flycode.example).');
}
