---
title: Explorer
hide:
  - navigation
  - toc
---

# Explorer

Filter the 200,660 cases of the study, compare the models, see how the error changes with time resolution, open any building's hourly series or write your own SQL. Everything runs in your browser with [DuckDB-WASM](https://duckdb.org/docs/api/wasm/overview); the data are the [open Parquet files](data.md).

<div id="lia-explorer" class="lia-ex" data-base="../data/">
  <div class="ex-status" id="ex-status" role="status">Loading the query engine and the case table (about 20 MB)…</div>
  <div class="ex-layout" hidden>
    <aside class="ex-filters" aria-label="Filters">
      <details open class="ex-filter-box">
        <summary>Filters <span id="ex-count" class="ex-count"></span></summary>
        <div class="ex-field">
          <label for="ex-preset">Models</label>
          <select id="ex-preset">
            <option value="poster">The poster's nine models</option>
            <option value="bottomup">Every bottom-up model (/o)</option>
            <option value="all">All 79 models</option>
            <option value="custom">Custom…</option>
          </select>
          <div id="ex-custom" class="ex-custom" hidden>
            <div class="ex-sub">Zoning</div><div class="ex-chips" data-field="zoning"></div>
            <div class="ex-sub">Stacking</div><div class="ex-chips" data-field="stacking"></div>
            <div class="ex-sub">Assignment</div><div class="ex-chips" data-field="assignment"></div>
          </div>
        </div>
        <div class="ex-field">
          <span class="ex-label">Load</span>
          <div class="ex-seg" data-field="load">
            <button type="button" data-v="heating" aria-pressed="true">Heating</button>
            <button type="button" data-v="cooling" aria-pressed="false">Cooling</button>
          </div>
        </div>
        <div class="ex-field">
          <span class="ex-label">Block</span>
          <div class="ex-seg" data-field="block">
            <button type="button" data-v="main" aria-pressed="true">Main</button>
            <button type="button" data-v="panel" aria-pressed="false">Size/height panel</button>
            <button type="button" data-v="" aria-pressed="false">Both</button>
          </div>
        </div>
        <div class="ex-field"><span class="ex-label">Building type <a href="#" class="ex-all" data-field="building_type">all</a></span><div class="ex-chips" data-field="building_type"></div></div>
        <div class="ex-field"><span class="ex-label">Climate class <a href="#" class="ex-all" data-field="climate_class">all</a></span><div class="ex-chips" data-field="climate_class"></div></div>
        <div class="ex-field"><span class="ex-label">Climate zone <a href="#" class="ex-all" data-field="climate_zone">all</a></span><div class="ex-chips" data-field="climate_zone"></div></div>
        <div class="ex-field"><span class="ex-label">Code era <a href="#" class="ex-all" data-field="era">all</a></span><div class="ex-chips" data-field="era"></div></div>
        <div class="ex-field"><span class="ex-label">Storeys <a href="#" class="ex-all" data-field="storeys">all</a></span><div class="ex-chips" data-field="storeys"></div></div>
        <button type="button" class="ex-btn ex-reset" id="ex-reset">Reset filters</button>
      </details>
    </aside>

    <div class="ex-main">
      <div class="ex-tabs" role="tablist" aria-label="Views">
        <button type="button" role="tab" aria-selected="true" aria-controls="ex-p-compare" id="ex-t-compare">Compare models</button>
        <button type="button" role="tab" aria-selected="false" aria-controls="ex-p-resolution" id="ex-t-resolution">Time resolution</button>
        <button type="button" role="tab" aria-selected="false" aria-controls="ex-p-hourly" id="ex-t-hourly">Hourly series</button>
        <button type="button" role="tab" aria-selected="false" aria-controls="ex-p-sql" id="ex-t-sql">SQL</button>
      </div>

      <section class="ex-panel" id="ex-p-compare" role="tabpanel" aria-labelledby="ex-t-compare">
        <div class="ex-row">
          <label>Measure
            <select id="ex-metric">
              <option value="rmse_w_m2">Hourly RMSE (W/m²)</option>
              <option value="rmse_daily_w_m2">Daily RMSE (W/m²)</option>
              <option value="rmse_monthly_w_m2">Monthly RMSE (W/m²)</option>
              <option value="annual_err_kwh_m2">Signed annual error (kWh/m²a)</option>
              <option value="annual_err_pct">Signed annual error (%)</option>
              <option value="cv_rmse_pct">CV(RMSE) (%)</option>
              <option value="nmbe_pct">NMBE (%)</option>
              <option value="peak_err_w_m2">Peak load error (W/m²)</option>
              <option value="peak_err_pct">Peak load error (%)</option>
              <option value="ldc_top1_rmse_w_m2">Top-1 % load-duration RMSE (W/m²)</option>
            </select>
          </label>
          <label>Group by
            <select id="ex-group">
              <option value="">Nothing</option>
              <option value="building_type">Building type</option>
              <option value="climate_class">Climate class</option>
              <option value="climate_zone">Climate zone</option>
              <option value="era">Code era</option>
              <option value="storeys">Storeys</option>
            </select>
          </label>
          <label class="ex-check"><input type="checkbox" id="ex-log"> Log scale</label>
        </div>
        <div id="ex-chart-compare" class="ex-chart"></div>
        <p class="ex-note">Box: interquartile range; line: median; whiskers: 5th–95th percentile of the cases that match. Models are sorted by their median.</p>
        <div class="ex-row ex-actions">
          <button type="button" class="ex-btn" id="ex-dl-cases">Download matching cases (CSV)</button>
          <button type="button" class="ex-btn" id="ex-dl-summary">Download this summary (CSV)</button>
        </div>
        <div class="ex-table-wrap"><table class="ex-table" id="ex-table-compare"></table></div>
      </section>

      <section class="ex-panel" id="ex-p-resolution" role="tabpanel" aria-labelledby="ex-t-resolution" hidden>
        <p class="ex-intro">Median RMSE of the matching cases when model and reference are compared hour by hour, day by day, month by month or over the whole year (the absolute mean error). Coarser comparisons let errors at different times cancel: this is the detail that is lost in aggregation.</p>
        <div id="ex-chart-resolution" class="ex-chart"></div>
        <div class="ex-table-wrap"><table class="ex-table" id="ex-table-resolution"></table></div>
      </section>

      <section class="ex-panel" id="ex-p-hourly" role="tabpanel" aria-labelledby="ex-t-hourly" hidden>
        <p class="ex-intro">One building context: the reference and the models' hourly load, averaged to the resolution you choose, with each model's error at that resolution. The context list follows the filters.</p>
        <div class="ex-row">
          <label class="ex-grow">Context <select id="ex-context"></select></label>
          <label>Resolution
            <select id="ex-res">
              <option value="1">1 hour</option><option value="3">3 hours</option><option value="6">6 hours</option>
              <option value="12">12 hours</option><option value="24" selected>1 day</option><option value="168">1 week</option>
              <option value="month">1 month</option>
            </select>
          </label>
          <label>Show
            <select id="ex-window">
              <option value="year">Whole year</option>
              <option value="1">January</option><option value="2">February</option><option value="3">March</option>
              <option value="4">April</option><option value="5">May</option><option value="6">June</option>
              <option value="7">July</option><option value="8">August</option><option value="9">September</option>
              <option value="10">October</option><option value="11">November</option><option value="12">December</option>
            </select>
          </label>
        </div>
        <div class="ex-chips ex-methods" id="ex-hourly-methods" aria-label="Models to show"></div>
        <p class="ex-note" id="ex-hourly-status"></p>
        <div id="ex-chart-hourly" class="ex-chart"></div>
        <div class="ex-row ex-actions">
          <button type="button" class="ex-btn" id="ex-dl-hourly">Download these series (CSV)</button>
        </div>
        <div class="ex-table-wrap"><table class="ex-table" id="ex-table-hourly"></table></div>
      </section>

      <section class="ex-panel" id="ex-p-sql" role="tabpanel" aria-labelledby="ex-t-sql" hidden>
        <p class="ex-intro">Query the data with DuckDB SQL. Tables: <code>cases</code>, <code>contexts</code>, <code>runs</code>, <code>instances</code>, <code>climates</code>, and, loaded when a query names them, <code>monthly</code> and <code>daily_&lt;type&gt;</code> (for example <code>daily_MediumOffice</code>). <code>hourly</code> holds the context last opened in <em>Hourly series</em>. Columns are described in the <a href="../data/#data-dictionary">data dictionary</a>.</p>
        <div class="ex-row">
          <label class="ex-grow">Examples
            <select id="ex-examples"></select>
          </label>
        </div>
        <textarea id="ex-sql" spellcheck="false" rows="8" aria-label="SQL query"></textarea>
        <div class="ex-row ex-actions">
          <button type="button" class="ex-btn primary" id="ex-run">Run (Ctrl+Enter)</button>
          <button type="button" class="ex-btn" id="ex-dl-sql">Download result (CSV)</button>
          <span class="ex-note" id="ex-sql-status"></span>
        </div>
        <div class="ex-table-wrap"><table class="ex-table" id="ex-table-sql"></table></div>
      </section>
    </div>
  </div>
</div>
