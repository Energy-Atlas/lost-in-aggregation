// Lost in Aggregation? explorer: DuckDB-WASM over the release's Parquet files, Observable Plot for the charts.
// Loaded on every page as a module; it does nothing unless the explorer container is present.

const DUCKDB_URL = "https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.29.0/+esm";
const PLOT_URL = "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6.16/+esm";

const POSTER = ["SM+Stack/o", "SMJP+Stack/o", "NS+SFZM/o", "CM+Stack/o", "SZF+Stack/o", "PC4.57+Stack/o",
  "PC3.0+Stack/o", "NS+SZFT/o", "NS+SZB/o"];
const SHORT = { "SM+Stack/o": "SM", "SMJP+Stack/o": "SMJP", "NS+SFZM/o": "SFZM", "CM+Stack/o": "CM", "SZF+Stack/o": "SZF",
  "PC4.57+Stack/o": "PC4.57", "PC3.0+Stack/o": "PC3.0", "NS+SZFT/o": "SZFT", "NS+SZB/o": "SZB" };
const MCOLOR = { "SM+Stack/o": "#0072B2", "SMJP+Stack/o": "#56B4E9", "CM+Stack/o": "#009E73", "PC4.57+Stack/o": "#E69F00",
  "PC3.0+Stack/o": "#D55E00", "SZF+Stack/o": "#CC79A7", "NS+SFZM/o": "#999933", "NS+SZFT/o": "#882255", "NS+SZB/o": "#332288" };
const ZCOLOR = { NS: "#7f7f7f", SM: "#0072B2", SMJP: "#56B4E9", CM: "#009E73", CMJP: "#44AA99", "PC4.57": "#E69F00",
  "PC3.0": "#D55E00", SZF: "#CC79A7" };
const ORDER = {
  building_type: ["LP", "PP", "CC", "SP", "RL", "WB", "OC", "EC", "GB", "SB", "HighriseApartment", "TerraceRow",
    "SmallOffice", "MediumOffice", "LargeOffice"],
  climate_class: ["Hot", "Mixed", "Cool", "Cold"],
  era: ["90.1-2019", "90.1-2007", "DOE-Ref-1980-2004", "DOE-Ref-pre-1980"],
  zoning: ["NS", "SM", "SMJP", "CM", "CMJP", "PC4.57", "PC3.0", "SZF"],
  stacking: ["Stack", "SFZM", "SZFT", "SZB"],
  assignment: ["o", "f", "u"],
};
const LABEL = {
  building_type: { LP: "LP LinearPlan", PP: "PP PointPlate", CC: "CC CourtCluster", SP: "SP StairPair", RL: "RL RadialLobes",
    WB: "WB WingedBand", OC: "OC OpenCourt", EC: "EC EnclosedCourt", GB: "GB GalleryBar", SB: "SB StairBayBar",
    HighriseApartment: "Highrise", TerraceRow: "Terrace row", SmallOffice: "Small office", MediumOffice: "Medium office",
    LargeOffice: "Large office" },
  era: { "90.1-2019": "90.1-2019", "90.1-2007": "90.1-2007", "DOE-Ref-1980-2004": "DOE Ref 1980–2004", "DOE-Ref-pre-1980": "DOE Ref pre-1980" },
  assignment: { o: "/o bottom-up", f: "/f fixed share", u: "/u uniform" },
};
const SIGNED = new Set(["annual_err_kwh_m2", "annual_err_pct", "nmbe_pct", "peak_err_w_m2", "peak_err_pct"]);
const CHIP_FIELDS = ["zoning", "stacking", "assignment", "building_type", "climate_class", "climate_zone", "era", "storeys"];
const EXAMPLES = [
  ["The poster's heat map: median hourly RMSE by building type", `SELECT building_type, method, load, round(median(rmse_w_m2), 3) AS median_rmse_w_m2, count(*) AS n
FROM cases
WHERE poster_main
GROUP BY ALL
ORDER BY load, building_type, median_rmse_w_m2;`],
  ["How often SM is the sole closest model (the poster's 76 % / 55 %)", `-- Class-level ranking as in the study: models served by the same simulation count once,
-- ties within the repeatability tolerance of 0.008 W/m2, models identical to the reference excluded,
-- among the 12 representative methods of the main block.
WITH c AS (
  SELECT context_id, load, run_id, min(rmse_w_m2) AS r, bool_or(method = 'SM+Stack/o') AS has_sm
  FROM cases
  WHERE block = 'main' AND available AND run_id <> ref_run_id
    AND method IN ('SM+Stack/o', 'SMJP+Stack/o', 'CM+Stack/o', 'PC4.57+Stack/o', 'PC3.0+Stack/o', 'SZF+Stack/o',
                   'NS+SFZM/o', 'NS+SZFT/o', 'NS+SZB/o', 'NS+Stack/u', 'NS+Stack/f', 'PC4.57+Stack/f')
  GROUP BY ALL
), w AS (
  SELECT *, r <= min(r) OVER (PARTITION BY context_id, load) + 0.008 AS win FROM c
), n AS (
  SELECT context_id, load, count(*) FILTER (WHERE win) AS winners FROM w GROUP BY ALL
)
SELECT load, count(*) AS eligible_contexts,
       count(*) FILTER (WHERE win AND winners = 1) AS sm_sole_best,
       round(100 * count(*) FILTER (WHERE win AND winners = 1) / count(*), 1) AS sm_sole_best_pct
FROM w JOIN n USING (context_id, load)
WHERE has_sm
GROUP BY load ORDER BY load;`],
  ["Error against time resolution, per model", `SELECT method, load,
       round(median(rmse_w_m2), 3)         AS hourly,
       round(median(rmse_daily_w_m2), 3)   AS daily,
       round(median(rmse_monthly_w_m2), 3) AS monthly,
       round(median(abs(mbe_w_m2)), 3)     AS annual
FROM cases WHERE poster_main
GROUP BY ALL ORDER BY load, hourly;`],
  ["Error against plan compactness (geometry descriptors)", `SELECT i.instance, i.compactness, i.perimeter_to_area_1_m, c.method,
       round(median(c.rmse_w_m2), 3) AS median_rmse_w_m2
FROM cases c JOIN contexts x USING (context_id) JOIN instances i ON i.instance = x.instance
WHERE c.poster_main AND c.load = 'heating'
GROUP BY ALL ORDER BY c.method, i.compactness;`],
  ["Monthly heating of one context, every run (loads the monthly table)", `SELECT r.simulated_as, m.month, round(m.heating_wh / 1000 / x.ref_floor_area_m2, 3) AS kwh_m2
FROM monthly m JOIN runs r USING (run_id) JOIN contexts x ON x.context_id = r.context_id
WHERE r.context_id = 'MediumOffice-2007-4A'
ORDER BY r.simulated_as, m.month;`],
  ["Daily cooling of the medium office reference runs (loads daily_MediumOffice)", `SELECT r.context_id, d.day, round(d.cooling_wh / 1000, 1) AS kwh
FROM daily_MediumOffice d JOIN runs r USING (run_id)
WHERE r.is_reference AND r.context_id LIKE 'MediumOffice-2007-%'
ORDER BY r.context_id, d.day;`],
  ["Hourly series of the context opened in Hourly series", `SELECT run_id, hour, heating_w, cooling_w FROM hourly ORDER BY run_id, hour LIMIT 1000;`],
];

const root = document.getElementById("lia-explorer");
let duckdb, Plot, db, conn, shards;
const loaded = new Set();
const opts = {};
const state = {};
let hourlyCtx = null;
let lastSql = null;

// ---------------------------------------------------------------------------------------------------- set-up
async function main() {
  const base = new URL(root.dataset.base, location.href);
  root.base = base;
  [duckdb, Plot] = await Promise.all([import(DUCKDB_URL), import(PLOT_URL)]);
  const bundle = await duckdb.selectBundle(duckdb.getJsDelivrBundles());
  const workerUrl = URL.createObjectURL(new Blob([`importScripts("${bundle.mainWorker}");`], { type: "text/javascript" }));
  db = new duckdb.AsyncDuckDB(new duckdb.VoidLogger(), new Worker(workerUrl));
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  URL.revokeObjectURL(workerUrl);
  conn = await db.connect();
  status("Loading the case table…");
  await Promise.all(["cases", "contexts", "runs", "instances", "climates"].map((t) => loadTable(t, new URL(`${t}.parquet`, base))));
  shards = await (await fetch(new URL("shards.json", base))).json();
  for (const f of CHIP_FIELDS) {
    const t = ["zoning", "stacking", "assignment"].includes(f) ? "cases" : "contexts";
    const vals = rows(await conn.query(`SELECT DISTINCT ${f} AS v FROM ${t} ORDER BY v`)).map((r) => r.v);
    opts[f] = ORDER[f] ? ORDER[f].filter((v) => vals.includes(v)) : vals;
  }
  resetState();
  buildControls();
  root.querySelector(".ex-layout").hidden = false;
  status("");
  refresh();
}

function resetState() {
  Object.assign(state, { preset: "poster", load: "heating", block: "main", metric: "rmse_w_m2", group: "", log: false });
  for (const f of CHIP_FIELDS) state[f] = new Set(opts[f]);
}

async function loadTable(name, url) {
  if (loaded.has(name)) return;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url.pathname.split("/").pop()}: HTTP ${r.status}`);
  await db.registerFileBuffer(`${name}.parquet`, new Uint8Array(await r.arrayBuffer()));
  await conn.query(`CREATE OR REPLACE VIEW "${name}" AS SELECT * FROM read_parquet('${name}.parquet')`);
  loaded.add(name);
}

// ---------------------------------------------------------------------------------------------------- helpers
function status(msg, err = false) {
  const el = document.getElementById("ex-status");
  el.textContent = msg; el.hidden = !msg; el.classList.toggle("error", err);
}
function rows(t) {
  return t.toArray().map((r) => {
    const o = r.toJSON();
    for (const k in o) if (typeof o[k] === "bigint") o[k] = Number(o[k]);
    return o;
  });
}
const lit = (v) => (typeof v === "number" ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
const nf = new Intl.NumberFormat("en-US", { maximumSignificantDigits: 3 });
const fmt = (v) => (v === null || v === undefined || Number.isNaN(v) ? "–" : Math.abs(v) >= 1000 ? Math.round(v).toLocaleString("en-US") : nf.format(v));
const label = (f, v) => (LABEL[f] && LABEL[f][v]) || String(v);
const colour = (method, zoning) => MCOLOR[method] || ZCOLOR[zoning] || "#777";
const short = (m) => SHORT[m] || m;
function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

function methodClause() {
  if (state.preset === "poster") return `method IN (${POSTER.map(lit).join(",")})`;
  if (state.preset === "bottomup") return "assignment = 'o'";
  if (state.preset === "all") return "TRUE";
  return ["zoning", "stacking", "assignment"].map((f) => inClause(f)).join(" AND ");
}
function inClause(f) {
  const s = state[f];
  if (s.size === opts[f].length) return "TRUE";
  if (!s.size) return "FALSE";
  return `${f} IN (${[...s].map(lit).join(",")})`;
}
function where() {
  const c = ["available", `load = ${lit(state.load)}`, methodClause()];
  if (state.block) c.push(`block = ${lit(state.block)}`);
  for (const f of ["building_type", "climate_class", "climate_zone", "era", "storeys"]) c.push(inClause(f));
  return c.join(" AND ");
}

async function download(sql, name) {
  const file = `export-${Date.now()}.csv`;
  await conn.query(`COPY (${sql}) TO '${file}' (HEADER, DELIMITER ',')`);
  const buf = await db.copyFileToBuffer(file);
  await db.dropFile(file);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([buf], { type: "text/csv" }));
  a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

function table(el, cols, data, max = Infinity) {
  const head = `<thead><tr>${cols.map((c) => `<th class="${c.num ? "num" : ""}">${c.label}</th>`).join("")}</tr></thead>`;
  const body = data.slice(0, max).map((r) => `<tr>${cols.map((c) => {
    const v = c.get ? c.get(r) : r[c.key];
    return `<td class="${c.num ? "num" : ""}">${c.html ? v : escapeHtml(c.num ? fmt(v) : v ?? "")}</td>`;
  }).join("")}</tr>`).join("");
  el.innerHTML = head + `<tbody>${body}</tbody>`;
}
function escapeHtml(s) { return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
const swatch = (m, z) => `<span class="ex-sw" style="--c:${colour(m, z)}"></span>`;

// ---------------------------------------------------------------------------------------------------- controls
function buildControls() {
  for (const box of root.querySelectorAll(".ex-chips[data-field]")) {
    const f = box.dataset.field;
    box.innerHTML = opts[f].map((v) => `<button type="button" class="ex-chip" data-v="${escapeHtml(v)}" aria-pressed="true">${escapeHtml(label(f, v))}</button>`).join("");
    box.addEventListener("click", (e) => {
      const b = e.target.closest(".ex-chip"); if (!b) return;
      const v = f === "storeys" ? Number(b.dataset.v) : b.dataset.v;
      state[f].has(v) ? state[f].delete(v) : state[f].add(v);
      b.setAttribute("aria-pressed", String(state[f].has(v)));
      refresh();
    });
  }
  for (const a of root.querySelectorAll(".ex-all")) {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const f = a.dataset.field;
      state[f] = state[f].size === opts[f].length ? new Set() : new Set(opts[f]);
      syncChips(); refresh();
    });
  }
  for (const seg of root.querySelectorAll(".ex-seg")) {
    seg.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      state[seg.dataset.field] = b.dataset.v;
      seg.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      refresh();
    });
  }
  const preset = document.getElementById("ex-preset");
  preset.addEventListener("change", () => {
    state.preset = preset.value;
    document.getElementById("ex-custom").hidden = state.preset !== "custom";
    refresh();
  });
  const metric = document.getElementById("ex-metric"), group = document.getElementById("ex-group"), log = document.getElementById("ex-log");
  metric.addEventListener("change", () => { state.metric = metric.value; log.disabled = SIGNED.has(state.metric); refresh(); });
  group.addEventListener("change", () => { state.group = group.value; refresh(); });
  log.addEventListener("change", () => { state.log = log.checked; refresh(); });
  document.getElementById("ex-reset").addEventListener("click", () => {
    resetState(); syncChips();
    preset.value = "poster"; document.getElementById("ex-custom").hidden = true;
    metric.value = "rmse_w_m2"; group.value = ""; log.checked = false; log.disabled = false;
    for (const seg of root.querySelectorAll(".ex-seg")) seg.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.v === state[seg.dataset.field])));
    refresh();
  });
  for (const t of root.querySelectorAll(".ex-tabs [role=tab]")) {
    t.addEventListener("click", () => {
      for (const x of root.querySelectorAll(".ex-tabs [role=tab]")) {
        const on = x === t; x.setAttribute("aria-selected", String(on));
        document.getElementById(x.getAttribute("aria-controls")).hidden = !on;
      }
      refresh();
    });
  }
  document.getElementById("ex-dl-cases").addEventListener("click", () => download(`SELECT * FROM cases WHERE ${where()}`, "cases-filtered.csv"));
  document.getElementById("ex-dl-summary").addEventListener("click", () => download(compareSql(), "summary.csv"));
  document.getElementById("ex-context").addEventListener("change", () => { hourlyMethodsFor = null; renderHourly(); });
  document.getElementById("ex-res").addEventListener("change", () => renderHourly());
  document.getElementById("ex-window").addEventListener("change", () => renderHourly());
  document.getElementById("ex-hourly-methods").addEventListener("click", (e) => {
    const b = e.target.closest(".ex-chip"); if (!b) return;
    b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true"));
    renderHourly();
  });
  document.getElementById("ex-dl-hourly").addEventListener("click", () => { if (lastHourlySql) download(lastHourlySql, `hourly-${hourlyCtx}.csv`); });
  // SQL console
  const ex = document.getElementById("ex-examples"), sql = document.getElementById("ex-sql");
  ex.innerHTML = EXAMPLES.map(([t], i) => `<option value="${i}">${escapeHtml(t)}</option>`).join("");
  sql.value = EXAMPLES[0][1];
  ex.addEventListener("change", () => { sql.value = EXAMPLES[Number(ex.value)][1]; });
  document.getElementById("ex-run").addEventListener("click", runSql);
  sql.addEventListener("keydown", (e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); runSql(); } });
  document.getElementById("ex-dl-sql").addEventListener("click", () => { if (lastSql) download(lastSql, "query.csv"); });
}
function syncChips() {
  for (const box of root.querySelectorAll(".ex-chips[data-field]")) {
    const f = box.dataset.field;
    box.querySelectorAll(".ex-chip").forEach((b) => {
      const v = f === "storeys" ? Number(b.dataset.v) : b.dataset.v;
      b.setAttribute("aria-pressed", String(state[f].has(v)));
    });
  }
}

const refresh = debounce(async () => {
  try {
    const c = rows(await conn.query(`SELECT count(*) AS n, count(DISTINCT context_id) AS k FROM cases WHERE ${where()}`))[0];
    document.getElementById("ex-count").textContent = `${c.n.toLocaleString("en-US")} cases · ${c.k.toLocaleString("en-US")} contexts`;
    const tab = root.querySelector(".ex-tabs [aria-selected=true]").id;
    if (tab === "ex-t-compare") await renderCompare(c.n);
    else if (tab === "ex-t-resolution") await renderResolution(c.n);
    else if (tab === "ex-t-hourly") await renderContexts();
  } catch (e) { console.error(e); status(`Query failed: ${e.message}`, true); }
}, 120);

function empty(el, msg) { el.innerHTML = `<p class="ex-empty">${msg}</p>`; }

// ---------------------------------------------------------------------------------------------------- compare
function compareSql() {
  const m = state.metric, g = state.group ? `CAST(${state.group} AS VARCHAR)` : "'All cases'";
  return `SELECT method, any_value(zoning) AS zoning, ${g} AS grp, count(*)::INTEGER AS n,
    quantile_cont(${m}, 0.05) AS p5, quantile_cont(${m}, 0.25) AS p25, median(${m}) AS p50,
    quantile_cont(${m}, 0.75) AS p75, quantile_cont(${m}, 0.95) AS p95, avg(${m}) AS mean
    FROM cases WHERE ${where()} AND ${m} IS NOT NULL GROUP BY method, grp`;
}
async function renderCompare(n) {
  const chart = document.getElementById("ex-chart-compare"), tbl = document.getElementById("ex-table-compare");
  if (!n) { empty(chart, "No cases match these filters."); tbl.innerHTML = ""; return; }
  const data = rows(await conn.query(compareSql()));
  const order = rows(await conn.query(`SELECT method FROM cases WHERE ${where()} AND ${state.metric} IS NOT NULL GROUP BY method ORDER BY median(${state.metric})`)).map((r) => r.method);
  const groups = state.group ? (ORDER[state.group] || [...new Set(data.map((d) => d.grp))].sort((a, b) => (state.group === "storeys" ? a - b : a < b ? -1 : 1)))
    .map(String).filter((g) => data.some((d) => d.grp === g)) : ["All cases"];
  const log = state.log && !SIGNED.has(state.metric);
  const floor = 1e-4;
  const clamp = (v) => (log ? Math.max(v, floor) : v);
  const metricLabel = document.getElementById("ex-metric").selectedOptions[0].textContent;
  const fill = (d) => colour(d.method, d.zoning);
  const marks = [
    Plot.ruleY(data, { y: "method", x1: (d) => clamp(d.p5), x2: (d) => clamp(d.p95), fy: "grp", stroke: fill, strokeOpacity: 0.8 }),
    Plot.barX(data, { y: "method", x1: (d) => clamp(d.p25), x2: (d) => clamp(d.p75), fy: "grp", fill, fillOpacity: 0.28, stroke: fill, insetTop: 2, insetBottom: 2 }),
    Plot.tickX(data, { y: "method", x: (d) => clamp(d.p50), fy: "grp", stroke: fill, strokeWidth: 2.5, insetTop: 1, insetBottom: 1 }),
    Plot.tip(data, Plot.pointer({ y: "method", x: (d) => clamp(d.p50), fy: "grp",
      title: (d) => `${d.method}${state.group ? ` · ${label(state.group, d.grp)}` : ""}\nmedian ${fmt(d.p50)}  IQR ${fmt(d.p25)}–${fmt(d.p75)}\n5–95 %: ${fmt(d.p5)}–${fmt(d.p95)}  n = ${d.n.toLocaleString("en-US")}` })),
  ];
  if (SIGNED.has(state.metric)) marks.unshift(Plot.ruleX([0], { stroke: "currentColor", strokeOpacity: 0.4 }));
  const rowH = order.length > 30 ? 12 : order.length > 12 ? 16 : 22;
  const plot = Plot.plot({
    width: Math.max(320, chart.clientWidth), marginLeft: 108, marginRight: state.group ? 110 : 16,
    height: groups.length * (order.length * rowH + 24) + 50,
    x: { type: log ? "log" : "linear", label: metricLabel, grid: true, nice: !log, tickFormat: log ? (d) => nf.format(d) : undefined },
    y: { domain: order, label: null, tickFormat: short },
    fy: state.group ? { domain: groups, label: null, tickFormat: (g) => label(state.group, g), padding: 0.08 } : { domain: groups, axis: null },
    style: { fontSize: "12px", background: "transparent" },
    marks,
  });
  chart.replaceChildren(plot);
  const rank = Object.fromEntries(order.map((m, i) => [m, i]));
  data.sort((a, b) => groups.indexOf(a.grp) - groups.indexOf(b.grp) || rank[a.method] - rank[b.method]);
  const cols = [{ label: "Model", html: true, get: (r) => `${swatch(r.method, r.zoning)}${escapeHtml(r.method)}` }];
  if (state.group) cols.push({ label: document.getElementById("ex-group").selectedOptions[0].textContent, get: (r) => label(state.group, r.grp) });
  cols.push({ label: "Cases", key: "n", num: true }, { label: "P5", key: "p5", num: true }, { label: "P25", key: "p25", num: true },
    { label: "Median", key: "p50", num: true }, { label: "P75", key: "p75", num: true }, { label: "P95", key: "p95", num: true }, { label: "Mean", key: "mean", num: true });
  table(tbl, cols, data);
}

// ---------------------------------------------------------------------------------------------------- resolution
async function renderResolution(n) {
  const chart = document.getElementById("ex-chart-resolution"), tbl = document.getElementById("ex-table-resolution");
  if (!n) { empty(chart, "No cases match these filters."); tbl.innerHTML = ""; return; }
  const data = rows(await conn.query(`SELECT method, any_value(zoning) AS zoning, count(*)::INTEGER AS n,
      median(rmse_w_m2) AS hourly, median(rmse_daily_w_m2) AS daily, median(rmse_monthly_w_m2) AS monthly, median(abs(mbe_w_m2)) AS annual
      FROM cases WHERE ${where()} GROUP BY method ORDER BY hourly`));
  const RES = ["Hourly", "Daily", "Monthly", "Annual"];
  const long = data.flatMap((d) => RES.map((r) => ({ method: d.method, zoning: d.zoning, res: r, v: Math.max(d[r.toLowerCase()], 1e-4) })));
  const fill = (d) => colour(d.method, d.zoning);
  const plot = Plot.plot({
    width: Math.max(320, chart.clientWidth), height: 420, marginLeft: 56, marginRight: 90,
    x: { domain: RES, label: "Model compared with the reference at this resolution", padding: 0.3 },
    y: { type: "log", label: "Median RMSE (W/m²)", grid: true, tickFormat: (d) => nf.format(d) },
    style: { fontSize: "12px", background: "transparent" },
    marks: [
      Plot.line(long, { x: "res", y: "v", z: "method", stroke: fill, strokeWidth: 1.6 }),
      Plot.dot(long, { x: "res", y: "v", fill, r: 3 }),
      Plot.text(long.filter((d) => d.res === "Annual"), { x: "res", y: "v", text: (d) => short(d.method), dx: 8, textAnchor: "start", fill, fontSize: 11 }),
      Plot.tip(long, Plot.pointer({ x: "res", y: "v", title: (d) => `${d.method}\n${d.res}: ${fmt(d.v)} W/m²` })),
    ],
  });
  chart.replaceChildren(plot);
  table(tbl, [{ label: "Model", html: true, get: (r) => `${swatch(r.method, r.zoning)}${escapeHtml(r.method)}` }, { label: "Cases", key: "n", num: true },
    { label: "Hourly", key: "hourly", num: true }, { label: "Daily", key: "daily", num: true }, { label: "Monthly", key: "monthly", num: true },
    { label: "Annual |mean error|", key: "annual", num: true }], data);
}

// ---------------------------------------------------------------------------------------------------- hourly
let hourlyMethodsFor = null, lastHourlySql = null;
async function renderContexts() {
  const sel = document.getElementById("ex-context");
  const list = rows(await conn.query(`SELECT x.context_id, x.building_type, x.building_type_label, x.era, x.climate_zone, x.instance
    FROM contexts x WHERE x.context_id IN (SELECT context_id FROM cases WHERE ${where()})`));
  const tr = Object.fromEntries(ORDER.building_type.map((t, i) => [t, i]));
  const er = Object.fromEntries(ORDER.era.map((t, i) => [t, i]));
  list.sort((a, b) => tr[a.building_type] - tr[b.building_type] || a.instance.localeCompare(b.instance) || er[a.era] - er[b.era] || a.climate_zone.localeCompare(b.climate_zone));
  const keep = sel.value;
  sel.innerHTML = list.map((c) => `<option value="${escapeHtml(c.context_id)}">${escapeHtml(`${c.building_type_label} · ${label("era", c.era)} · ${c.climate_zone} — ${c.context_id}`)}</option>`).join("");
  if (!list.length) { empty(document.getElementById("ex-chart-hourly"), "No contexts match these filters."); return; }
  const pick = list.find((c) => c.context_id === keep) || list.find((c) => c.context_id === "MediumOffice-2007-4A") || list[0];
  sel.value = pick.context_id;
  await renderHourly();
}

async function ensureHourly(ctx) {
  if (hourlyCtx === ctx) return;
  const x = rows(await conn.query(`SELECT building_type FROM contexts WHERE context_id = ${lit(ctx)}`))[0];
  const override = new URLSearchParams(location.search).get("hourly");
  const site = shards.sites[shards.type_site[x.building_type]];
  const url = new URL(`hourly/${x.building_type}/${ctx}.parquet`, override ? new URL(override, location.href) : site.url);
  const st = document.getElementById("ex-hourly-status");
  st.textContent = `Loading the hourly series of ${ctx}…`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`hourly data for ${ctx}: HTTP ${r.status} (${url.host})`);
  const buf = new Uint8Array(await r.arrayBuffer());
  const mb = (buf.byteLength / 1e6).toFixed(1);
  if (hourlyCtx) await db.dropFile("hourly.parquet").catch(() => {});
  await db.registerFileBuffer("hourly.parquet", buf);
  await conn.query("CREATE OR REPLACE VIEW hourly AS SELECT * FROM read_parquet('hourly.parquet')");
  hourlyCtx = ctx;
  st.textContent = `${ctx}: ${mb} MB of hourly data from ${url.host || "this site"}.`;
}

async function renderHourly() {
  const ctx = document.getElementById("ex-context").value;
  if (!ctx) return;
  const chart = document.getElementById("ex-chart-hourly"), tbl = document.getElementById("ex-table-hourly");
  try { await ensureHourly(ctx); } catch (e) { empty(chart, e.message); return; }
  const load = state.load;
  const cs = rows(await conn.query(`SELECT method, zoning, run_id, ref_run_id, rmse_w_m2 FROM cases
    WHERE context_id = ${lit(ctx)} AND load = ${lit(load)} AND available AND ${methodClause()} ORDER BY rmse_w_m2`));
  const area = rows(await conn.query(`SELECT ref_floor_area_m2 AS a FROM contexts WHERE context_id = ${lit(ctx)}`))[0].a;
  const ref = rows(await conn.query(`SELECT ref_run_id AS r FROM contexts WHERE context_id = ${lit(ctx)}`))[0].r;
  // model chips: the methods of the current set in this context; first visit shows up to nine
  const box = document.getElementById("ex-hourly-methods");
  if (hourlyMethodsFor !== `${ctx}|${state.preset}|${load}`) {
    // first visit: the closest, a middle and the farthest model, so the lines stay readable
    const on = new Set([cs[0], cs[Math.floor((cs.length - 1) / 2)], cs[cs.length - 1]].filter(Boolean).map((c) => c.method));
    box.innerHTML = cs.map((c) => `<button type="button" class="ex-chip" data-v="${escapeHtml(c.method)}" aria-pressed="${on.has(c.method)}">${swatch(c.method, c.zoning)}${escapeHtml(c.method)}</button>`).join("");
    hourlyMethodsFor = `${ctx}|${state.preset}|${load}`;
  }
  const shown = new Set([...box.querySelectorAll(".ex-chip[aria-pressed=true]")].map((b) => b.dataset.v));
  const sel = cs.filter((c) => shown.has(c.method));
  const runs = [...new Set([ref, ...cs.map((c) => c.run_id)])];
  const res = document.getElementById("ex-res").value, win = document.getElementById("ex-window").value;
  const period = res === "month" ? "month(ts)" : `hour // ${Number(res)}`;
  const base = `WITH h AS (SELECT run_id, hour, ${load}_w / ${area} AS v, TIMESTAMP '2023-01-01 00:00:00' + to_hours(hour::BIGINT) AS ts
      FROM hourly WHERE run_id IN (${runs.map(lit).join(",")})),
    p AS (SELECT run_id, ${period} AS period, min(ts) AS t, avg(v) AS v FROM h GROUP BY run_id, period)`;
  const err = rows(await conn.query(`${base}, e AS (SELECT p.run_id, p.v - r.v AS d, r.v AS rv FROM p JOIN p r ON r.period = p.period AND r.run_id = ${lit(ref)})
    SELECT run_id, sqrt(avg(d * d)) AS rmse, avg(d) AS mbe, 100 * sqrt(avg(d * d)) / nullif(avg(rv), 0) AS cv FROM e GROUP BY run_id`));
  const E = Object.fromEntries(err.map((r) => [r.run_id, r]));
  const winClause = win === "year" ? "TRUE" : `month(t) = ${Number(win)}`;
  const plotRuns = [ref, ...sel.map((c) => c.run_id)];
  lastHourlySql = `${base} SELECT run_id, t AS period_start, v AS ${load}_w_m2 FROM p WHERE run_id IN (${plotRuns.map(lit).join(",")}) AND ${winClause} ORDER BY run_id, t`;
  const series = rows(await conn.query(`${base} SELECT run_id, epoch_ms(t) AS t_ms, v FROM p WHERE run_id IN (${plotRuns.map(lit).join(",")}) AND ${winClause} ORDER BY run_id, t`));
  // one line per shown method (several methods may share a run); the reference first
  const byRun = {};
  for (const s of series) (byRun[s.run_id] ||= []).push(s);
  const lines = [{ name: "Reference (NS+Stack/o)", color: "currentColor", w: 2.2, pts: byRun[ref] || [] }]
    .concat(sel.map((c) => ({ name: c.method, color: colour(c.method, c.zoning), w: 1.3, pts: byRun[c.run_id] || [] })));
  const data = lines.flatMap((l) => l.pts.map((p) => ({ name: l.name, t: new Date(p.t_ms), v: p.v })));
  const step = res !== "1";
  const plot = Plot.plot({
    width: Math.max(320, chart.clientWidth), height: 380, marginLeft: 52,
    x: { type: "utc", label: null, tickFormat: win === "year" ? "%b" : "%d %b" },
    y: { label: `${load === "heating" ? "Heating" : "Cooling"} load (W/m²)`, grid: true },
    color: { domain: lines.map((l) => l.name), range: lines.map((l) => l.color), legend: true },
    style: { fontSize: "12px", background: "transparent" },
    marks: [
      Plot.ruleY([0], { stroke: "currentColor", strokeOpacity: 0.3 }),
      // models first, the reference last so it stays on top
      ...lines.slice(1).concat(lines.slice(0, 1)).map((l) => Plot.line(data.filter((d) => d.name === l.name), { x: "t", y: "v", stroke: "name", strokeWidth: l.w, curve: step ? "step-after" : "linear" })),
      Plot.tip(data, Plot.pointerX({ x: "t", y: "v", stroke: "name", title: (d) => `${d.name}\n${d.t.toISOString().slice(0, 13).replace("T", " ")}:00  ${fmt(d.v)} W/m²` })),
    ],
  });
  chart.replaceChildren(plot);
  const resLabel = document.getElementById("ex-res").selectedOptions[0].textContent;
  table(tbl, [
    { label: "Model", html: true, get: (r) => `${swatch(r.method, r.zoning)}${escapeHtml(r.method)}` },
    { label: `RMSE at ${resLabel} (W/m²)`, num: true, get: (r) => E[r.run_id]?.rmse },
    { label: "Mean error (W/m²)", num: true, get: (r) => E[r.run_id]?.mbe },
    { label: "CV(RMSE) (%)", num: true, get: (r) => E[r.run_id]?.cv },
    { label: "Hourly RMSE in the case table", key: "rmse_w_m2", num: true },
  ], cs);
}

// ---------------------------------------------------------------------------------------------------- SQL
async function runSql() {
  const text = document.getElementById("ex-sql").value.trim().replace(/;\s*$/, "");
  const st = document.getElementById("ex-sql-status"), tbl = document.getElementById("ex-table-sql");
  if (!text) return;
  try {
    st.textContent = "Running…";
    if (/\bmonthly\b/i.test(text)) await loadTable("monthly", new URL("monthly.parquet", root.base));
    for (const m of text.matchAll(/\bdaily_([A-Za-z]+)\b/g)) {
      if (!ORDER.building_type.includes(m[1])) throw new Error(`no daily table for "${m[1]}"; use one of ${ORDER.building_type.join(", ")}`);
      await loadTable(`daily_${m[1]}`, new URL(`daily/${m[1]}.parquet`, root.base));
    }
    if (/\bhourly\b/i.test(text) && !hourlyCtx) throw new Error("open a context in Hourly series first, then query the table hourly");
    const t0 = performance.now();
    const res = await conn.query(text);
    const data = rows(res);
    const cols = res.schema.fields.map((f) => ({ label: escapeHtml(f.name), key: f.name, num: /Int|Float|Decimal/.test(String(f.type)) }));
    table(tbl, cols, data, 1000);
    lastSql = text;
    st.textContent = `${data.length.toLocaleString("en-US")} rows${data.length > 1000 ? " (showing 1,000; download for all)" : ""} · ${Math.round(performance.now() - t0)} ms`;
  } catch (e) {
    st.textContent = `Error: ${e.message}`;
    tbl.innerHTML = "";
  }
}

if (root) main().catch((e) => { console.error(e); status(`The explorer could not start: ${e.message}`, true); });
