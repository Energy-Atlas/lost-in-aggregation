# Lost in Aggregation?

This repository holds the companion page for the ASIM 2026 poster (Singapore, 16–18 November 2026), contribution 247: *Lost in Aggregation? The Diminishing Returns of Geometric Fidelity and Thermal Zoning Details in Urban-Scale Building Energy Simulations*. The authors are Chengxuan Li, Zihan Jimmy Wang and Timur Dogan of the Environmental Systems Lab, Cornell University.

The page is published at <https://energy-atlas.github.io/lost-in-aggregation/>, which is where the poster's QR code points.

## Layout

| Path | Content |
|---|---|
| `site/index.html` | The landing page: one static file with no build step. |
| `site/assets/` | The poster PDF, a preview image and the poster figures (PNG, 2000 px wide). |
| `.github/workflows/pages.yml` | On every push to `main`, checks that every local link and image exists, then deploys `site/` to GitHub Pages. |

## Publishing

1. Create the repository `energy-atlas/lost-in-aggregation` on GitHub.
2. In *Settings → Pages*, set *Source* to **GitHub Actions**.
3. Push `main`; the workflow deploys the page.

The figures are produced by the poster build in the BEMGen repository (`research/reduced-campaign/figures-f1/poster-asim2026/`) and copied here.
