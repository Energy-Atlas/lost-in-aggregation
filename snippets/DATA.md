# Lost in Aggregation? Data release 1.0.0

Results of the RC1 zoning and stacking study: 1,270 building contexts, 79 simplified models per context, each compared with a detailed EnergyPlus reference. This release accompanies the ASIM 2026 poster *Lost in Aggregation? The Diminishing Returns of Geometric Fidelity and Thermal Zoning Details in Urban-Scale Building Energy Simulations* (C. Li, Z. J. Wang, T. Dogan, Environmental Systems Lab, Cornell University).

- Explorer and documentation: <https://energy-atlas.github.io/lost-in-aggregation/>
- Licence: CC BY 4.0 (see `LICENSE.txt`)
- All files are Apache Parquet with zstd compression. DuckDB, pandas, polars, R `arrow` and Excel Power Query read them.
- These are comparative simulation results against detailed reference models. They are not measurements.

<!-- --8<-- [start:body] -->
## Scope

| Item | Count |
|---|---|
| Contexts (building instance × code era × climate) | 1,270 (main block 1,046; size and height panel 224) |
| Building types | 15 (10 midrise apartment families, a highrise, a terrace row, small, medium and large offices) |
| Climates | 19 (ASHRAE 169 zones 0A to 8) |
| Code eras | 90.1-2019, 90.1-2007, DOE Reference 1980–2004, DOE Reference pre-1980 |
| Simplified models (methods) | 79 |
| Cases (context × method × load) | 200,660, of which 200,468 have a result |
| Simulation runs with hourly series | 45,424 (1,270 references and 44,154 model runs) |

The poster's nine models are the cases with `poster_main = true`. They comprise 1,046 contexts, 9,414 cases per load and 8,012 unique runs.

## Methods

A method is written `zoning+stacking/assignment`, for example `SM+Stack/o`.

| Part | Code | Meaning |
|---|---|---|
| Zoning | NS | No simplification: every room a zone (the reference zoning) |
| | SM | Semantic merge: neighbouring rooms of the same type merge |
| | SMJP | Semantic merge with joined pieces: same-type zones also join across the plan |
| | CM | Conditioned merge: rooms merge by conditioning flag |
| | CMJP | Conditioned merge with joined pieces |
| | PC4.57, PC3.0 | Perimeter–core zoning with 4.57 m or 3.0 m perimeter zones |
| | SZF | One zone per floor |
| Stacking | Stack | Every storey explicit |
| | SFZM | Floor multiplier: representative storeys with multipliers; interstorey surfaces adiabatic |
| | SZFT | One zone per floor entry |
| | SZB | One zone per building |
| Assignment | o | Bottom-up: each zone keeps the programs of the rooms it merges |
| | f | Fixed prototype share: one frozen whole-building program mixture per context, applied to every zone after zoning and stacking |
| | u | Uniform composition: the target's own program shares, mixed into every room before zoning |

The reference of each context is `NS+Stack/o`. It is the run with `is_reference = true` in `runs.parquet`.

## Files

| File | Rows | Content |
|---|---|---|
| `cases.parquet` | 200,660 | One row per context, method and load, with every error measure |
| `contexts.parquet` | 1,270 | One row per context |
| `runs.parquet` | 45,424 | One row per simulation run with its annual totals |
| `instances.parquet` | 44 | Geometry descriptors per building instance |
| `climates.parquet` | 19 | Weather file and degree days per climate zone |
| `monthly.parquet` | 545,088 | Monthly heating and cooling energy per run |
| `site-data.zip` | | The explorer's data folder: the tables above plus `daily/<type>.parquet` (daily energy per run) and `shards.json` |
| `hourly-<type>.parquet` | 8,760 per run | Hourly heating and cooling per run |
| `hourly-other-<type>.parquet` | 8,760 per run | Hourly lights, equipment, district heating and cooling meters, and mean air temperature per run |
| `storey-hourly-<type>.parquet` | 8,760 per run and storey | Hourly heating and cooling per modelled storey (RC1 runs only; see Limits) |
| `zone-annual.parquet` | one per zone and run | Annual sums and maxima per zone (RC1 runs only) |
| `VERIFY.json` | | Checks of this release against its sources and the poster |
| `SHA256SUMS.txt` | | Checksums of every file |

`<type>` is one of `LP PP CC SP RL WB OC EC GB SB HighriseApartment TerraceRow SmallOffice MediumOffice LargeOffice`.

Join keys:
- `cases.context_id` joins to `contexts.context_id`.
- `cases.run_id` and `cases.ref_run_id` join to `runs.run_id` and to the series files.
- `contexts.instance` joins to `instances.instance`.
- `contexts.climate_zone` joins to `climates.climate_zone`.

## Series

Hourly values cover a non-leap year from 1 January, 01:00. `hour` runs from 0 to 8759, where `hour = 0` is the hour ending 01:00 on 1 January.

| Column | Unit | Definition |
|---|---|---|
| `heating_w`, `cooling_w` | W | Building total of `Zone Ideal Loads Zone Sensible Heating Energy` / `… Cooling Energy` over all zones, multipliers applied, divided by 3,600 s: the hour's mean sensible ideal-load power |
| `InteriorLights`, `InteriorEquipment` | W | `InteriorLights:Electricity`, `InteriorEquipment:Electricity`, hourly mean power |
| `MeterHeating`, `MeterCooling` | W | `DistrictHeatingWater:Facility`, `DistrictCooling:Facility`, hourly mean power |
| `MeanAirTemperature` | °C | Floor-area-weighted mean of `Zone Mean Air Temperature` (zone floor area × multipliers) |
| storey `heating_w`, `cooling_w` | W | As above, summed over the zones whose name begins with the storey label (`L0` lowest; only modelled storeys appear, e.g. a floor-multiplier model lists its representative storeys, with multipliers applied as reported) |
| `heating_wh`, `cooling_wh` (monthly, daily) | Wh | Sum of the hourly values over the month or day |
| zone annual `*_sum_wh`, `*_max_wh` | Wh | Annual sum and largest hourly value of the zone's sensible ideal load, as reported; `area` = zone floor area × multipliers, m² |

Hourly values are stored as float32, rounded from the float64 the campaign extracted (relative difference below 1e-6). Every error in `cases.parquet` is computed from the float64 values.

Divide by `contexts.ref_floor_area_m2` (the reference's conditioned floor area) to obtain W/m². Every case error uses that same area for the model and the reference.

## Case table columns

Identification and grouping:

| Column | Meaning |
|---|---|
| `context_id` | Context: instance, era and climate, e.g. `CC-M-H4-m07-4A` |
| `method` | `zoning+stacking/assignment` |
| `zoning`, `stacking`, `assignment` | Parts of the method |
| `load` | `heating` or `cooling` |
| `building_type`, `family`, `program`, `instance` | Building type (see `<type>` above), plan family, DOE program, generated building instance |
| `block`, `role` | `main` (canonical size and height) or `panel` (`size` or `height` variants in climates 4A and 7) |
| `storeys` | Storeys of the instance |
| `era`, `climate_zone`, `climate_class` | Code era; ASHRAE 169 zone; class Hot (0–2), Mixed (3–4), Cool (5–6), Cold (7–8) |
| `poster_main` | The case is one of the poster's nine models in the main block |

Provenance:

| Column | Meaning |
|---|---|
| `available` | False for 96 generator-rejected slots (192 rows), which have no result |
| `result_source` | `own run`, `shared run (deduplicated)`, `identical to reference (zero error)` or `unavailable` |
| `run_id`, `ref_run_id` | The run that provides the result, and the context's reference run |
| `case_slot`, `slot_status`, `duplicate_of`, `dedup_kind` | The method's slot. A duplicate is served by the run of `duplicate_of`, found after export by identical IDF body or equal physical signature |
| `series_source` | `new` (RC1), `reuse` (an identical run from an earlier batch) or `new (50-day warm-up rerun)` |
| `model_zones` | Thermal zones in the simplified model |
| `heated_area_change_pct`, `cooled_area_change_pct`, `…_m2`, `max_area_change_pct` | Heated and cooled floor area of the model relative to the reference |
| `composition` | Program composition of the instance relative to its canonical source |
| `lights_annual_dev_pct`, `equip_annual_dev_pct` | Annual lighting and equipment energy, model against reference (internal-load conservation check) |

Error measures. Here *y* is the model's hourly load, *r* the reference's, *n* = 8,760 and *A* = `ref_floor_area_m2`.

| Column | Unit | Definition |
|---|---|---|
| `ref_kwh_m2`, `model_kwh_m2` | kWh/m²a | Σr / 1000 / A, Σy / 1000 / A |
| `annual_err_kwh_m2` | kWh/m²a | (Σy − Σr) / 1000 / A (signed) |
| `annual_err_pct` | % | 100 (Σy − Σr) / Σr |
| `mbe_w_m2` | W/m² | mean(y − r) / A |
| `nmbe_pct` | % | 100 Σ(r − y) / (n · mean r) (ASHRAE Guideline 14 sign: positive when the model is low) |
| `rmse_w_m2` | W/m² | √mean((y − r)²) / A, hourly |
| `rmse_daily_w_m2`, `rmse_monthly_w_m2` | W/m² | The same, on daily or monthly means of y − r (each day or month weighs the same) |
| `cv_rmse_pct` | % | 100 √mean((y − r)²) / mean r |
| `peak_err_w_m2`, `peak_err_pct` | W/m², % | (max y − max r) / A; 100 (max y − max r) / max r |
| `p99_err_w_m2`, `p99_err_pct` | W/m², % | The same on the 99th percentile of hourly load |
| `ldc_full_pct` | % | 100 RMSE of the sorted load-duration curves / mean r |
| `ldc_top1_pct`, `ldc_top1_rmse_w_m2` | %, W/m² | The same over the top 1 % of hours (88 h) |
| `ref_mean_w_m2`, `ref_peak_w_m2`, `ref_p99_w_m2` | W/m² | Reference mean, peak and 99th percentile load / A |

Relative measures are undefined, and left empty, when the reference load is zero.

## Limits

- **Reused runs.** 4,330 runs were reused from earlier batches with identical IDF and weather. They have building-level series but no storey or zone series (`runs.has_storey_series = false`).
- **SmallOffice (D2).** Occupied-zone infiltration is about 2.6–2.7× the source, because the attic is omitted.
- **Medium and large offices (D1).** Source-defined concrete drop-ceiling mass is included.
- **Weather.** The 2B and 3C weather files differ from the infiltration reference stations (`contexts.weather_disclosure`).
- **Not redistributed.** Weather files are not included; `climates.weather_file` names each one.

## How it was made

The tables are written by `research/reduced-campaign/data-release/export_release.py` in the BEMGen repository. That script reads the evaluation-revision E1 consolidation and the campaign's hourly series. No simulation was rerun.

`verify_release.py` checks the release, and its result is `VERIFY.json`. It checks:
- the counts;
- that the poster's heat-map medians and method-grid points are reproduced exactly;
- RMSE recomputed from the float32 hourly files;
- daily and monthly sums against the annual totals;
- that every run has 8,760 hourly rows.

<!-- --8<-- [end:body] -->
## Citation

Li, C., Wang, Z. J., & Dogan, T. (2026). Lost in Aggregation? The Diminishing Returns of Geometric Fidelity and Thermal Zoning Details in Urban-Scale Building Energy Simulations. Poster, ASIM 2026, Singapore. Data release 1.0.0, <https://github.com/Energy-Atlas/lost-in-aggregation/releases/tag/data-v1.0.0>.
