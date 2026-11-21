# verityresearch.us

The live Verity site, served by GitHub Pages from this repo (custom domain in `CNAME`).

`index.html` is the whole site: one self-contained file with its CSS and JavaScript inline. Three.js r128 (cdnjs, pinned with SRI) and Google Fonts load externally, and the page falls back to a static coin and system fonts if they don't.

The source parts and build script live in `ubc-2026/verity`, folder `site/` on the `website` branch. `DESIGN.md` is the approved design system.

To publish: rebuild `index.html` there with `sh build.sh`, copy `dist/index.html` here, keep `CNAME` and `.nojekyll`, then push to `main`.

Carry forward the homepage search and sharing tags when copying a rebuild from the source repository. Keep `favicon.png`, `verity-research-preview.png`, `robots.txt` and `sitemap.xml` at the published root. Run `node .github/scripts/check-site-metadata.mjs` before publishing. The same check runs on pull requests.

Data rule: every quote and score comes from the Nov 17 and 18, 2026 Gemini Exchange captures and analysis. Anything simulated is labelled DEMO FIXTURE on the page.
