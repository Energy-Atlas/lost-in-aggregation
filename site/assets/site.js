/* Lost in Aggregation? companion page: heat-map explorer, lightbox, citation, section highlighting. */
(function () {
  "use strict";

  /* Median hourly RMSE (W/m2) per building type and model over all contexts of the type,
     from the poster's Fig. 3 data (PWa_where_errors_grow_data.csv). 0 = identical to the reference. */
  var HM = {"methods":["SM","SMJP","SFZM","CM","SZF","PC4.57","PC3.0","SZFT","SZB"],"units":["LP LinearPlan","PP PointPlate","CC CourtCluster","SP StairPair","RL RadialLobes","WB WingedBand","OC OpenCourt","EC EnclosedCourt","GB GalleryBar","SB StairBayBar","Highrise","Terrace row","Small office","Medium office","Large office"],"heating":[[0.0365,0.1727,0.1323,0.1228,0.2877,0.2542,0.3834,0.3674,0.489],[0.1182,0.1182,0.1476,0.1343,0.1461,0.187,0.3287,0.2718,0.3649],[0.0504,0.0822,0.1313,0.0645,0.2118,0.1847,0.2224,0.3239,0.398],[0.0,0.0472,0.1702,0.0,0.322,0.426,0.4741,0.5608,0.6864],[0.0612,0.154,0.133,0.0786,0.2694,0.1939,0.2181,0.3911,0.4842],[0.0698,0.2526,0.1135,0.1062,0.385,0.2611,0.2115,0.4795,0.5652],[0.0414,0.0868,0.1315,0.0586,0.2438,0.2359,0.2566,0.3816,0.4779],[0.0418,0.0745,0.1349,0.0491,0.2287,0.2186,0.2466,0.345,0.4352],[0.0481,0.0502,0.1554,0.0845,0.2905,0.5302,0.4723,0.5207,0.6998],[0.006,0.1014,0.1497,0.0116,0.2709,0.3432,0.3885,0.4224,0.5244],[0.0285,0.1419,0.0653,0.0577,0.1966,0.1981,0.2973,0.3011,0.3557],[0.1216,0.1216,0.2131,0.1216,0.1216,0.3818,0.4337,0.1784,0.413],[0.0974,0.176,0.0,1.0312,1.0312,0.3449,0.5611,1.0312,1.0312],[0.0253,0.4083,0.2803,1.2303,1.2303,0.2443,0.3329,1.2303,1.8863],[0.0512,0.3724,0.0829,0.444,0.444,0.3733,0.5476,0.429,0.4462]],"cooling":[[0.0422,0.1843,0.158,0.2354,0.4709,0.5019,0.6202,0.7383,0.9241],[0.1276,0.1276,0.1872,0.1469,0.15,0.2956,0.4469,0.4168,0.6321],[0.0578,0.0841,0.1889,0.1367,0.313,0.376,0.4891,0.5573,0.7101],[0.0,0.0706,0.2327,0.0,0.4061,0.6474,0.7635,0.9152,1.1707],[0.0786,0.168,0.1914,0.1353,0.307,0.3177,0.4385,0.4902,0.6819],[0.0813,0.2526,0.178,0.2096,0.418,0.4265,0.5055,0.6918,0.8484],[0.0435,0.0845,0.1973,0.0563,0.3437,0.4363,0.5467,0.6708,0.8547],[0.054,0.0797,0.1795,0.1028,0.3476,0.4209,0.5345,0.6226,0.7875],[0.078,0.081,0.197,0.1164,0.9174,1.136,0.7508,1.2808,1.4495],[0.0219,0.0866,0.1903,0.0319,0.3737,0.5456,0.6684,0.7297,0.9254],[0.0377,0.1489,0.1062,0.0945,0.4008,0.4265,0.5111,0.809,0.9053],[0.1217,0.1217,0.2893,0.1217,0.1217,0.3474,0.4739,0.1937,0.5962],[0.0471,0.1323,0.0,0.7298,0.7298,0.2695,0.3639,0.7298,0.7298],[0.0364,0.5044,0.2132,1.7797,1.7797,0.2535,0.3514,1.7797,1.8639],[0.1513,0.5412,0.1391,1.0586,1.0586,1.0,1.2321,1.2713,1.3352]]};
  var CIVIDIS = ["#00224e", "#083370", "#35456c", "#4f576c", "#666970", "#7d7c78", "#948e77", "#aea371", "#c8b866", "#e5cf52", "#fee838"];
  var VMIN = 0.01, VMAX = 3.0, MIDRISE = 10;

  function hex2rgb(h) { return [1, 3, 5].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
  var STOPS = CIVIDIS.map(hex2rgb);
  function colour(v) {                       // log colour scale, as the poster figure
    var t = (Math.log10(Math.max(v, VMIN)) - Math.log10(VMIN)) / (Math.log10(VMAX) - Math.log10(VMIN));
    t = Math.min(1, Math.max(0, t)) * (STOPS.length - 1);
    var i = Math.min(STOPS.length - 2, Math.floor(t)), f = t - i, a = STOPS[i], b = STOPS[i + 1];
    return "rgb(" + [0, 1, 2].map(function (k) { return Math.round(a[k] + (b[k] - a[k]) * f); }).join(",") + ")";
  }
  function fmt(v) { return v === 0 ? "≡ref" : v.toFixed(2); }

  var table = document.getElementById("hm");
  if (table) {
    var state = { load: "heating", sortBy: -1 };
    var readout = document.getElementById("hm-readout");
    var head = table.querySelector("thead tr"), body = table.querySelector("tbody");

    HM.methods.forEach(function (m, k) {
      var th = document.createElement("th"); th.scope = "col";
      var b = document.createElement("button"); b.type = "button"; b.textContent = m;
      b.title = "Sort building types by " + m;
      b.addEventListener("click", function () { state.sortBy = state.sortBy === k ? -1 : k; render(); });
      th.appendChild(b); head.appendChild(th);
    });

    function render() {
      var data = HM[state.load], order = HM.units.map(function (_, i) { return i; });
      if (state.sortBy >= 0) order.sort(function (a, b) { return data[a][state.sortBy] - data[b][state.sortBy]; });
      head.querySelectorAll("button").forEach(function (b, k) {
        if (k === state.sortBy) b.setAttribute("aria-sort", "ascending"); else b.removeAttribute("aria-sort");
      });
      body.innerHTML = "";
      order.forEach(function (i, pos) {
        if (state.sortBy < 0 && i === MIDRISE) {
          var gap = document.createElement("tr"); gap.className = "gap"; gap.setAttribute("aria-hidden", "true");
          gap.innerHTML = "<th></th>" + HM.methods.map(function () { return "<td></td>"; }).join("");
          body.appendChild(gap);
        }
        var tr = document.createElement("tr");
        var th = document.createElement("th"); th.scope = "row"; th.textContent = HM.units[i]; tr.appendChild(th);
        data[i].forEach(function (v, k) {
          var td = document.createElement("td");
          td.textContent = fmt(v);
          td.style.background = colour(v);
          td.style.color = v < 0.25 ? "#fff" : "#16181d";
          td.dataset.unit = HM.units[i]; td.dataset.method = HM.methods[k]; td.dataset.v = v;
          tr.appendChild(td);
        });
        body.appendChild(tr);
      });
      readout.textContent = "Hover or tap a cell for its value. Click a model to sort the building types by it.";
    }

    body.addEventListener("mouseover", show);
    body.addEventListener("click", show);
    function show(e) {
      var td = e.target.closest("td"); if (!td || !td.dataset.unit) return;
      var v = parseFloat(td.dataset.v);
      readout.innerHTML = "<b>" + td.dataset.unit + "</b> · <b>" + td.dataset.method + "</b> · " + state.load + ": " +
        (v === 0 ? "identical to the reference" : "median hourly RMSE " + v.toFixed(3) + " W/m²");
      var col = Array.prototype.indexOf.call(td.parentNode.children, td);
      head.querySelectorAll("th").forEach(function (h, k) { h.classList.toggle("hot", k === col); });
    }
    table.addEventListener("mouseleave", function () { head.querySelectorAll("th").forEach(function (h) { h.classList.remove("hot"); }); });

    document.querySelectorAll("[data-load]").forEach(function (b) {
      b.addEventListener("click", function () {
        state.load = b.dataset.load;
        document.querySelectorAll("[data-load]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
        render();
      });
    });
    render();
  }

  /* lightbox for figures */
  var lb = document.getElementById("lb");
  if (lb && typeof lb.showModal === "function") {
    var lbImg = lb.querySelector("img"), lbCap = lb.querySelector("p");
    document.querySelectorAll(".fig .frame").forEach(function (f) {
      f.addEventListener("click", function () {
        var img = f.querySelector("img"), cap = f.closest("figure").querySelector("figcaption");
        lbImg.src = img.currentSrc || img.src; lbImg.alt = img.alt;
        lbCap.textContent = cap ? cap.textContent : "";
        lb.showModal();
      });
    });
    lb.addEventListener("click", function () { lb.close(); });
  } else {
    document.querySelectorAll(".fig .frame").forEach(function (f) {   // no <dialog>: open the image itself
      f.addEventListener("click", function () { window.open(f.querySelector("img").src, "_blank", "noopener"); });
    });
  }

  /* citation tabs and copy */
  var tabs = document.querySelectorAll(".cite [role=tab]");
  tabs.forEach(function (t) {
    t.addEventListener("click", function () {
      tabs.forEach(function (x) {
        var on = x === t; x.setAttribute("aria-selected", String(on));
        document.getElementById(x.getAttribute("aria-controls")).hidden = !on;
      });
    });
  });
  var copy = document.getElementById("copy");
  if (copy) {
    copy.addEventListener("click", function () {
      var pane = document.querySelector(".cite pre:not([hidden])");
      var done = function () { copy.textContent = "Copied"; setTimeout(function () { copy.textContent = "Copy"; }, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(pane.textContent).then(done, function () {});
    });
  }

  /* highlight the section in view */
  var links = Array.prototype.slice.call(document.querySelectorAll(".nav li a"));
  if ("IntersectionObserver" in window && links.length) {
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { links.forEach(function (a) { a.classList.remove("on"); }); if (byId[e.target.id]) byId[e.target.id].classList.add("on"); }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(byId).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }
})();
