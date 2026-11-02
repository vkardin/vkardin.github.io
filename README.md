# vKardin websites

Canonical source for https://vkardin.github.io/ and the product websites:

- `/video-glow/`
- `/leveler/`
- `/video-drift/`
- `/snapt/` (including `/ru/` and `/uk/`)
- `/uni-homebot/`

Shared `family.css`, `family.js`, `family-head.js`, `family-assets/` and localized `media/` live at the repository root. Product-specific styles, scripts and assets stay in the product folders. App code and releases stay in their existing repositories.

GitHub Pages publishes `main` from the repository root. Pages in the five app
repositories and the old Snapt Pages workflow are disabled, so they cannot
override these paths. Keep app code and releases in their existing repositories;
publish website changes here.

Serve locally with `python3 -m http.server 8000` from this directory. Check product pages, language versions, demos, support/privacy pages and shared previews before deploying.

## Localized pages and SEO

Every landing page and the extension support/privacy pages have a static HTML
version in English, Russian and Ukrainian. English uses the unprefixed root;
Russian and Ukrainian use `/ru/` and `/uk/`. Old `/en/` links redirect to the
English entry. All language selectors use the order EN, RU, UK.

On an entry URL, a first-time visit uses the first supported browser/system
language, falling back to English. A manual language choice is remembered and
takes priority. Explicit `/ru/` and `/uk/` links never change their language.
Static English HTML, canonical URLs and hreflang remain available to crawlers.

To update pages:

1. Edit markup in `tools/templates/*.html.in`, translations in the existing
   product dictionaries, and metadata in `tools/seo-copy.json`.
2. Run `npm ci`, `npm run build`, and `npm test` with Node.js 24.
3. Commit both source changes and the generated pages, sitemap and robots file.

The build does not contact external services. Checks cover all 36 canonical
pages, reciprocal hreflang, local assets, internal links and anchors, JSON-LD,
and runtime language stability with an opposite saved language preference.
Browser checks are still needed for layout and interactive demos.

`robots.txt` lives at the host root and points to `/sitemap.xml`. Submit that
sitemap in the verified Search Console property, inspect representative URLs
for each language, and monitor indexing, impressions and click-through rate.
Field Core Web Vitals require real-user data; a Lighthouse score alone does
not confirm field performance or search rankings.
