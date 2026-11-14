# Lost in Aggregation?

This repository holds the companion site and open data of the ASIM 2026 poster (Singapore, 16–18 November 2026), contribution 247: *Lost in Aggregation? The Diminishing Returns of Geometric Fidelity and Thermal Zoning Details in Urban-Scale Building Energy Simulations*. The authors are Chengxuan Li, Zihan Jimmy Wang and Timur Dogan of the Environmental Systems Lab, Cornell University.

- **Site:** <https://energy-atlas.github.io/lost-in-aggregation/>, which is where the poster's QR code points.
- **Data:** GitHub Release [data-v1.0.0](https://github.com/Energy-Atlas/lost-in-aggregation/releases/tag/data-v1.0.0), CC BY 4.0. It covers 1,270 contexts, 79 simplified models, 200,660 cases, and the hourly series of 45,424 EnergyPlus runs.

## How the site works

The site is built with MkDocs Material and has no server: the explorer runs DuckDB-WASM in the browser.

| Part | Where |
|---|---|
| Landing page | `overrides/home.html`, `docs/stylesheets/home.css`, `docs/javascripts/home.js` |
| Explorer | `docs/explorer.md`, `docs/javascripts/explorer.js`, `docs/stylesheets/explorer.css` |
| Data and Methods pages | `docs/data.md` (includes `snippets/DATA.md`, the release's dictionary), `docs/methods.md` |
| Case table, contexts, runs, monthly and daily series | Not in git. The workflow takes `site-data.zip` from the release, checks its checksum, and unpacks it into `docs/data/`. |
| Hourly series | Served by three data sites, `Energy-Atlas/lost-in-aggregation-data-1` to `-3` (a Pages site holds at most 1 GB). `shards.json` in the site data says which site holds which building type. |
| Poster source | `poster/poster_asim2026_zoning_lod.pptx`, the editable poster as presented (not published by the site; its PDF is `docs/assets/poster.pdf`) |

On every push to `main`, the workflow:
1. downloads the site data from the release;
2. builds with `mkdocs build --strict`;
3. checks the landing page's links;
4. deploys.

## Local preview

```bash
pip install -r requirements.txt
```

```bash
mkdocs serve
```

First unpack `site-data.zip` from the release into `docs/data/`. To try the hourly view without the data sites, put context files under `docs/hourly-local/hourly/<type>/` and open `/explorer/?hourly=../hourly-local/`.

## Where the data come from

The release is produced by `research/reduced-campaign/data-release/` in the BEMGen repository:
- `export_release.py` reads the study's existing outputs; nothing is rerun;
- `verify_release.py` checks the export against its sources and the poster;
- `package_release.py` writes the release assets.

`snippets/DATA.md` is a copy of that folder's `DATA.md`; update both together.
