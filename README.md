# FlyCode

FlyCode is a static portfolio for a web agency. The site uses one shared HTML template, independent Spanish, German and English dictionaries in `translations/`, and the existing vanilla CSS and JavaScript.

## Build the language pages

Requirements: Node.js 18 or newer. There are no package installs or third-party dependencies.

From this directory, run:

```sh
node scripts/build.mjs
```

The command generates `dist/es/index.html`, `dist/de/index.html` and `dist/en/index.html`, then copies the shared styles, script, logo, and fonts into `dist/`. Every page links to the other two languages. Spanish is the default language (`x-default`). The output uses relative asset URLs, so CSS, JavaScript, images, and fonts resolve from all language routes. The generator does not delete existing files in `dist/`.

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
