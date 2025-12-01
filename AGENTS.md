# Repository Guidelines

## Project Structure
- Base web root is `Stoned Rabbits/` served as a static site; `index.html` is the landing page.
- `pages/` holds feature pages (mint, revenue-pass, lottery, utilities, team, partners, etc.); `pages/PHP/` contains lightweight backend helpers.
- `css/` provides global styles (`style.css`, `common.css`) and grid helpers; `js/` contains vanilla scripts for navigation, ticker, gallery, and the Mario mini-game; `images/` stores all assets; `docs/` keeps maintenance notes such as `MOBILE-MENU-FIX.md`.
- `firebase.json` serves the current directory; adjust only if the hosting root changes.

## Run, Build, Develop
- Local preview: `cd "Stoned Rabbits"; python -m http.server 8000` then open `http://localhost:8000/index.html`.
- Firebase deploy (if configured): `firebase deploy --only hosting` after authenticating and setting the target in `.firebaserc`.
- No bundler is used—edit HTML/CSS/JS directly and keep relative paths accurate when adding new assets or pages.

## Coding Style & Naming
- Prefer 2-space indentation; include trailing semicolons in JS for consistency; stick to ES6+ vanilla patterns.
- Use kebab-case for assets and page names (e.g., `revenue-pass.html`, `clean-nft-gallery.js`).
- Reuse the palette and CSS variables in `css/style.css` and layout utilities in `css/common.css`; keep page-specific overrides scoped in small inline `<style>` blocks when needed.
- Avoid inline event handlers; attach behavior in the relevant script (often `js/main.js` or a page-specific JS file).

## Testing Guidelines
- Smoke-test nav behavior (mobile toggle, anchor scroll), hero video playback, ticker rendering, and all CTA links on desktop and mobile widths; confirm no horizontal overflow.
- For pages that hit PHP endpoints, exercise the scripts under `pages/PHP/` locally or in staging before shipping.
- Manually check Lighthouse basics (performance and accessibility) for the landing page and any page you modify.

## Commit & Pull Request Guidelines
- Use conventional-style messages (`fix: ...`, `feat: ...`, `refactor: ...`, `docs: ...`) in imperative voice, matching existing history.
- PRs should include a short scope description, before/after screenshots or GIFs for UI changes, and links to related issues or tasks.
- Call out any placeholder data or API stubs touched (e.g., ticker data in `js/main.js`) and ensure no secrets land in the repo; review `SECURITY_CONFIG.md` and `SECURITY_REPAIR_REPORT.md` when making security-impacting changes.
