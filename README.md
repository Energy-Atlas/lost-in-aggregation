# Lost in Aggregation?

This repository holds the companion page for the ASIM 2026 poster (Singapore, 16–18 November 2026), contribution 247: *Lost in Aggregation? The Diminishing Returns of Geometric Fidelity and Thermal Zoning Details in Urban-Scale Building Energy Simulations*. The authors are Chengxuan Li, Zihan Jimmy Wang and Timur Dogan of the Environmental Systems Lab, Cornell University.

The page is published at <https://energy-atlas.github.io/lost-in-aggregation/>, which is where the poster's QR code points.

## Layout

| Path | Content |
|---|---|
| `site/index.html` | The landing page. It is static, with no build step. |
| `site/assets/site.css`, `site/assets/site.js` | Styles (light and dark), the interactive heat map, the figure lightbox and the citation box. |
| `site/assets/poster.pdf` | The final poster, as presented. |
| `site/assets/poster_preview.jpg` | A preview image of the poster. |
| `site/assets/*.png` | The poster figures, 2000 px wide. |
| `site/assets/logos/` | The affiliation and support logos from the poster footer. |
| `.github/workflows/pages.yml` | On every push to `main`, checks that every local link and image exists, then deploys `site/` to GitHub Pages. |

## Updating

Every push to `main` redeploys the page.

The figures come from the poster build in the BEMGen repository (`research/reduced-campaign/figures-f1/poster-asim2026/`). The heat-map values in `site.js` are the poster's Fig. 3 data (`PWa_where_errors_grow_data.csv`). The poster PDF is the final version, which includes manual edits made after the scripted build.

To preview locally, serve the folder:

```bash
python -m http.server 8765 --directory site
```
