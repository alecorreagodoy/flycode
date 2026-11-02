import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
const locales = ['es', 'de', 'en'];
const languageNames = { es: 'Español', de: 'Deutsch', en: 'English' };
const translations = {};
const templates = {};
for (const locale of locales) {
    translations[locale] = JSON.parse(await readFile(path.join(root, 'translations', `${locale}.json`), 'utf8'));
}
for (const name of ['index', 'portfolio', 'project']) {
    templates[name] = await readFile(path.join(root, `${name}.html`), 'utf8');
}
const projects = JSON.parse(await readFile(path.join(root, 'projects.json'), 'utf8'));

function flatten(value, prefix = '', result = {}) {
    for (const [key, child] of Object.entries(value)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (child && typeof child === 'object' && !Array.isArray(child)) flatten(child, fullKey, result);
        else result[fullKey] = child;
    }
    return result;
}

function escapeHtml(value) {
    return String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function route(locale, page, slug = '') {
    return page === 'home' ? `/${locale}/` : page === 'portfolio' ? `/${locale}/proyectos/` : `/${locale}/proyectos/${slug}/`;
}

function publicUrl(pathname) {
    const base = process.env.SITE_URL?.replace(/\/+$/, '');
    return base ? `${base}${pathname}` : pathname;
}

function relativePath(from, to) {
    const fromParts = from.split('/').filter(Boolean);
    const toParts = to.split('/').filter(Boolean);
    let shared = 0;
    while (shared < fromParts.length && fromParts[shared] === toParts[shared]) shared++;
    return `${'../'.repeat(fromParts.length - shared)}${toParts.slice(shared).join('/')}${to.endsWith('/') ? '' : ''}` || './';
}

function relativeOrAbsolute(from, to) {
    return process.env.SITE_URL ? publicUrl(to) : relativePath(from, to);
}

function projectCard(project, locale, fromPage) {
    const name = project.name[locale];
    const type = project.type[locale];
    const technology = project.technology[locale];
    const url = relativeOrAbsolute(route(locale, fromPage), route(locale, 'project', project.slug));
    return `<article class="project-card"><a class="project-card-link" href="${escapeHtml(url)}"><div class="project-art project-art-pending"><span>${escapeHtml(translations[locale].project.screenshotMissing)}</span></div><div class="project-info"><div><p class="project-type">${escapeHtml(type)}</p><h3>${escapeHtml(name)}</h3></div><p>${escapeHtml(technology)}</p></div></a></article>`;
}

function metadata(locale, page, slug = '', title, description) {
    const currentPath = route(locale, page, slug);
    const otherLocales = locales.filter((item) => item !== locale);
    const [first, second] = otherLocales;
    const from = currentPath;
    return {
        'meta.lang': locale,
        'meta.title': title,
        'meta.description': description,
        'meta.canonical': publicUrl(currentPath),
        'meta.urlEs': publicUrl(route('es', page, slug)),
        'meta.urlDe': publicUrl(route('de', page, slug)),
        'meta.urlEn': publicUrl(route('en', page, slug)),
        'meta.homeUrl': relativeOrAbsolute(from, route(locale, 'home')),
        'meta.portfolioUrl': relativeOrAbsolute(from, route(locale, 'portfolio')),
        'meta.stylesUrl': relativeOrAbsolute(from, '/style.css'),
        'meta.mediaqueriesUrl': relativeOrAbsolute(from, '/mediaqueries.css'),
        'meta.scriptUrl': relativeOrAbsolute(from, '/script.js'),
        'meta.logoUrl': relativeOrAbsolute(from, '/assets/flycode-mark.svg'),
        'meta.languageUrl': relativeOrAbsolute(from, route(first, page, slug)),
        'meta.languageCode': first,
        'meta.languageName': languageNames[first],
        'meta.languageLabel': translations[locale].nav[`switchTo${{ es: 'Spanish', de: 'German', en: 'English' }[first]}`],
        'meta.languageUrl2': relativeOrAbsolute(from, route(second, page, slug)),
        'meta.languageCode2': second,
        'meta.languageName2': languageNames[second],
        'meta.languageLabel2': translations[locale].nav[`switchTo${{ es: 'Spanish', de: 'German', en: 'English' }[second]}`],
    };
}

async function render(templateName, locale, page, slug = '', extra = {}) {
    const dict = flatten(translations[locale]);
    const values = { ...dict, ...metadata(locale, page, slug, extra.title ?? translations[locale].meta.title, extra.description ?? translations[locale].meta.description), ...extra.values };
    const template = templates[templateName];
    const keys = [...template.matchAll(/\{\{([^{}]+)\}\}/g)].map((match) => match[1]);
    const missing = [...new Set(keys)].filter((key) => !(key in values));
    if (missing.length) throw new Error(`${locale}/${page}: missing template values: ${missing.join(', ')}`);
    const html = template.replace(/\{\{([^{}]+)\}\}/g, (_, key) => {
        // Cards are the only placeholder containing generator-built markup.
        return key === 'projects.cards' ? values[key] : escapeHtml(values[key]);
    });
    const pagePath = route(locale, page, slug);
    const target = path.join(output, pagePath.slice(1), 'index.html');
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, html);
}

for (const locale of locales) {
    const homeCards = projects.map((project) => projectCard(project, locale, 'home')).join('\n');
    const portfolioCards = projects.map((project) => projectCard(project, locale, 'portfolio')).join('\n');
    await render('index', locale, 'home', '', { values: { 'meta.portfolioUrl': relativeOrAbsolute(route(locale, 'home'), route(locale, 'portfolio')), 'projects.cards': homeCards } });
    const portfolio = translations[locale].portfolio;
    await render('portfolio', locale, 'portfolio', '', {
        title: `${portfolio.title} | FlyCode`,
        description: portfolio.intro,
        values: { 'projects.cards': portfolioCards },
    });
    for (const project of projects) {
        const localized = {
            name: project.name[locale], description: project.description[locale],
            type: project.type[locale], technology: project.technology[locale], work: project.work[locale],
        };
        await render('project', locale, 'project', project.slug, {
            title: `${localized.name} | FlyCode`,
            description: localized.description,
            values: {
                'project.name': localized.name,
                'project.description': localized.description,
                'project.type': localized.type,
                'project.technology': localized.technology,
                'project.workCopy': localized.work,
                'project.url': project.url,
                'meta.portfolioUrl': relativeOrAbsolute(route(locale, 'project', project.slug), route(locale, 'portfolio')),
            },
        });
    }
}

for (const entry of ['style.css', 'mediaqueries.css', 'script.js', 'assets']) {
    await cp(path.join(root, entry), path.join(output, entry), { recursive: true, force: true });
}
await mkdir(path.join(output, 'hero-animation'), { recursive: true });
for (const entry of ['fc-idea.css', 'fc-idea.js']) {
    await cp(path.join(root, 'hero-animation', entry), path.join(output, 'hero-animation', entry), { force: true });
}
console.log(`Built home, portfolio, and ${projects.length} project pages in ${locales.length} languages in dist/.`);
if (!process.env.SITE_URL) console.log('Set SITE_URL to the public origin for absolute canonical and hreflang URLs.');
