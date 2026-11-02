# vKardin websites

Canonical source for https://vkardin.github.io/ and the product websites:

- `/video-glow/`
- `/leveler/`
- `/video-drift/`
- `/snapt/` (including `/ru/` and `/uk/`)
- `/uni-homebot/`

Shared `family.css`, `family.js`, `family-head.js`, `family-assets/` and localized `media/` live at the repository root. Product-specific styles, scripts and assets stay in the product folders. App code and releases stay in their existing repositories.

GitHub Pages publishes `main` from the repository root. To complete the cutover, disable Pages in the five app repositories and disable the Snapt Pages workflow; their existing deployments otherwise override these paths. Keep the old sources until the cutover has been verified.

Serve locally with `python3 -m http.server 8000` from this directory. Check product pages, language versions, demos, support/privacy pages and shared previews before deploying.
