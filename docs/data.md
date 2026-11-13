---
title: Data and downloads
---

# Data and downloads

All results of the study are open under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/): every case, every simulation run and every hour. The files are [Apache Parquet](https://parquet.apache.org/). The [explorer](explorer.md) reads the same files in your browser; nothing runs on a server.

These are comparative EnergyPlus simulation results against detailed reference models, not measurements.

## Downloads

Every file is an asset of the GitHub Release [data-v1.0.0](https://github.com/Energy-Atlas/lost-in-aggregation/releases/tag/data-v1.0.0), and `SHA256SUMS.txt` there holds the checksums.

| File | Size | Content |
|---|---|---|
| [cases.parquet](https://github.com/Energy-Atlas/lost-in-aggregation/releases/download/data-v1.0.0/cases.parquet) | 16 MB | 200,660 cases (context × method × load) with every error measure |
| [contexts.parquet](https://github.com/Energy-Atlas/lost-in-aggregation/releases/download/data-v1.0.0/contexts.parquet), [runs.parquet](https://github.com/Energy-Atlas/lost-in-aggregation/releases/download/data-v1.0.0/runs.parquet), [instances.parquet](https://github.com/Energy-Atlas/lost-in-aggregation/releases/download/data-v1.0.0/instances.parquet), [climates.parquet](https://github.com/Energy-Atlas/lost-in-aggregation/releases/download/data-v1.0.0/climates.parquet) | 2 MB | Contexts, runs with annual totals, geometry descriptors, climates |
| [monthly.parquet](https://github.com/Energy-Atlas/lost-in-aggregation/releases/download/data-v1.0.0/monthly.parquet) | 5 MB | Monthly heating and cooling energy of every run |
| [site-data.zip](https://github.com/Energy-Atlas/lost-in-aggregation/releases/download/data-v1.0.0/site-data.zip) | 94 MB | All of the above, plus daily heating and cooling energy of every run |
| `hourly-<type>.parquet` | 2.4 GB in total | Hourly heating and cooling of every run, one file per building type |
| `hourly-other-<type>.parquet` | 3.1 GB in total | Hourly lights, equipment, district heating and cooling meters and mean air temperature |
| `storey-hourly-<type>.parquet` | 8.2 GB in total | Hourly heating and cooling per modelled storey |
| [zone-annual.parquet](https://github.com/Energy-Atlas/lost-in-aggregation/releases/download/data-v1.0.0/zone-annual.parquet) | 40 MB | Annual sums and maxima per zone |
| [DATA.md](https://github.com/Energy-Atlas/lost-in-aggregation/releases/download/data-v1.0.0/DATA.md), [VERIFY.json](https://github.com/Energy-Atlas/lost-in-aggregation/releases/download/data-v1.0.0/VERIFY.json) | | This dictionary; the release checks |

`<type>` is one of `LP PP CC SP RL WB OC EC GB SB HighriseApartment TerraceRow SmallOffice MediumOffice LargeOffice`, for example [hourly-MediumOffice.parquet](https://github.com/Energy-Atlas/lost-in-aggregation/releases/download/data-v1.0.0/hourly-MediumOffice.parquet).

## Quick start

=== "DuckDB"

    ```sql
    -- median hourly RMSE of the poster's nine models by building type (the poster's Fig. 3)
    SELECT building_type, method, load, median(rmse_w_m2) AS rmse_w_m2
    FROM 'cases.parquet'
    WHERE poster_main
    GROUP BY ALL ORDER BY load, building_type, rmse_w_m2;

    -- one context's hourly heating, model against reference, in W/m2
    SELECT h.hour, h.heating_w / c.ref_floor_area_m2 AS w_m2, r.simulated_as
    FROM 'hourly-MediumOffice.parquet' h
    JOIN 'runs.parquet' r USING (run_id)
    JOIN 'contexts.parquet' c ON c.context_id = h.context_id
    WHERE h.context_id = 'MediumOffice-2007-4A';
    ```

=== "Python (pandas)"

    ```python
    import pandas as pd

    cases = pd.read_parquet("cases.parquet")
    poster = cases[cases.poster_main]
    print(poster.groupby(["load", "building_type", "method"]).rmse_w_m2.median())

    hourly = pd.read_parquet("hourly-MediumOffice.parquet",
                             filters=[("context_id", "=", "MediumOffice-2007-4A")])
    ```

=== "R (arrow)"

    ```r
    library(arrow); library(dplyr)
    cases <- read_parquet("cases.parquet")
    cases |> filter(poster_main) |>
      group_by(load, building_type, method) |>
      summarise(rmse_w_m2 = median(rmse_w_m2))
    ```

A context id combines the instance, the era and the climate (for example `CC-M-H4-m07-4A` or `MediumOffice-2007-4A`); list them with `SELECT context_id FROM 'contexts.parquet'`.

## Data dictionary

--8<-- "DATA.md:body"

## How to cite

Li, C., Wang, Z. J., & Dogan, T. (2026). *Lost in Aggregation? The Diminishing Returns of Geometric Fidelity and Thermal Zoning Details in Urban-Scale Building Energy Simulations.* Poster, ASIM 2026, Singapore. Data release 1.0.0, <https://github.com/Energy-Atlas/lost-in-aggregation/releases/tag/data-v1.0.0>.
