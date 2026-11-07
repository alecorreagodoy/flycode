# FlyCode

FlyCode is a static portfolio for a web agency. The site uses static HTML templates, independent Spanish, German and English dictionaries in `translations/`, reusable project data in `projects.json`, and vanilla CSS and JavaScript.

## Build the language pages

Requirements: Node.js 18 or newer. There are no package installs or third-party dependencies.

From this directory, run:

```sh
node scripts/build.mjs
```

The command generates a home page, portfolio index, and project detail pages in Spanish, German and English under `dist/`, then copies the shared styles, script, logo, and fonts into `dist/`. Spanish is the default language (`x-default`). Equivalent pages link to each other with `hreflang`; canonical URLs describe each page. Relative page and asset URLs work in local previews. The generator does not delete existing files in `dist/`.

Routes:

- Home: `/es/`, `/de/`, `/en/`
- Portfolio: `/es/proyectos/`, `/de/proyectos/`, `/en/proyectos/`
- Detail: `/{language}/proyectos/{slug}/`

## Add a project

Add one object to `projects.json`. Give it a URL-safe, unique `slug`, a published `url`, and localized `name`, `description`, `type`, `technology`, and `work` values for `es`, `de`, and `en`. The generator uses the same data for the home cards, portfolio listing, and detail page in each language; no page template needs to be duplicated.

Real project screenshots belong in `assets/projects/{slug}/`. Set the screenshot path, dimensions, and localized alternative text in `projects.json`; the generator renders the image in the home cards, portfolio, and detail pages. Both Juan Ballarino and Di Giovanni Repuestos currently have an optimized desktop screenshot. Projects without a screenshot continue to use the translated placeholder.

For production, set `SITE_URL` to the public site origin (including any base path, if the site is hosted below a domain subpath) before building. This writes absolute canonical and `hreflang` URLs into all three pages:

```sh
SITE_URL=https://www.example.com node scripts/build.mjs
```

Replace the example with FlyCode's real public URL. Without `SITE_URL`, canonical and language-alternate links use relative URLs, which is useful for local previews.

## Preview locally

Build first, then serve `dist/` over HTTP. For example:

```sh
node scripts/build.mjs
cd dist
python3 -m http.server 8000
```

Open `http://localhost:8000/es/`, `http://localhost:8000/de/` and `http://localhost:8000/en/`. Use the language links in the navigation to switch between equivalent pages. The site can also be opened directly from files, but an HTTP server better matches production routing.

## Publish

Configure the static hosting service to publish the contents of `dist/` as its document root. The resulting files are `es/index.html`, `de/index.html` and `en/index.html`, so standard static hosting serves them at `/es/`, `/de/` and `/en/`. No locale-specific rewrite rules are required when the host serves directory index files by default. Run the build as the host's build command, or build locally and upload `dist/`.

If the site is mounted under a path such as `https://example.com/flycode/`, set `SITE_URL=https://example.com/flycode` during the build and publish `dist/` at that same base path. Hosting services vary in their default directory-index and trailing-slash behavior; if the host does not serve `index.html` for a directory, configure its equivalent directory-index behavior for `/es/`, `/de/` and `/en/`.
