// ---- Colors (consistent across charts) ----
const COLORS_LINE = {
  Europe:  "#1f77b4",  // blue
  Ukraine: "#ffbf00",  // yellow
  Russia:  "#d62728"   // red
};

const COLORS_WAFFLE = {
  Ukraine: "#ffbf00",  // yellow
  Russia:  "#d62728",  // red
  Other:   "#9e9e9e"   // grey
};

// ---- Line chart (time series) ----
function renderLineChart() {
  const ctx = document.getElementById("line-canvas");
  if (!ctx || !window.Chart) return;

  new Chart(ctx, {
    type: "line",
    data: {
      labels: window.YEARS,
      datasets: [
        { label: "Europe",  data: window.DATA.Europe,  borderColor: COLORS_LINE.Europe,  pointRadius: 0, borderWidth: 2 },
        { label: "Ukraine", data: window.DATA.Ukraine, borderColor: COLORS_LINE.Ukraine, pointRadius: 0, borderWidth: 2 },
        { label: "Russia",  data: window.DATA.Russia,  borderColor: COLORS_LINE.Russia,  pointRadius: 0, borderWidth: 2 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top" },
        title: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          // optional: nicer ticks every 10k
          ticks: {
            stepSize: 10000,
            callback: v => v.toLocaleString()
          },
          title: { display: true, text: "Deaths" }
        },
        x: { title: { display: true, text: "Year" } }
      }
    }
  });
}

// ---- Waffle chart pieces (Europe as total; Ukraine, Russia, Other) ----
function buildWaffleBlock(year) {
  const idx = window.YEARS.indexOf(year);
  if (idx < 0) return null;

  const europe  = Number(window.DATA.Europe[idx] ?? 0);
  const ukraine = Number(window.DATA.Ukraine[idx] ?? 0);
  const russia  = Number(window.DATA.Russia[idx] ?? 0);
  const other   = Math.max(0, europe - (ukraine + russia));
  const total   = europe;

  // wrapper
  const wrap = document.createElement("div");
  wrap.className = "waffle-wrap";

  // title
  const h = document.createElement("h3");
  h.textContent = year;
  h.style.margin = "0";
  wrap.appendChild(h);

  // grid
  const grid = document.createElement("div");
  grid.className = "waffle-chart";
  wrap.appendChild(grid);

  if (!total || !isFinite(total) || total <= 0) {
    grid.textContent = "No data";
    return wrap;
  }

  // compute tile counts with largest remainders → sum to 100
  const parts = [
    { key: "Ukraine", val: ukraine, color: COLORS_WAFFLE.Ukraine },
    { key: "Russia",  val: russia,  color: COLORS_WAFFLE.Russia  },
    { key: "Other",   val: other,   color: COLORS_WAFFLE.Other   }
  ];
  parts.forEach(p => {
    const share = (p.val / total) * 100;
    p.floor = Math.floor(share);
    p.frac  = share - p.floor;
  });
  let used = parts.reduce((s, p) => s + p.floor, 0);
  let rem  = 100 - used;
  parts.sort((a, b) => b.frac - a.frac);
  for (let i = 0; i < rem; i++) parts[i % parts.length].floor++;

  // build tiles (grouped, no randomization)
  const order = ["Ukraine", "Russia", "Other"];
  order.forEach(name => {
    const p = parts.find(x => x.key === name);
    for (let i = 0; i < p.floor; i++) {
      const tile = document.createElement("div");
      tile.className = "waffle-square";
      tile.style.backgroundColor = p.color; // only color inline; sizes via CSS
      tile.title = p.key;
      grid.appendChild(tile);
    }
  });

  // legend
  const legend = document.createElement("div");
  legend.className = "waffle-legend";
  wrap.appendChild(legend);

  order.forEach(name => {
    const p = parts.find(x => x.key === name);
    const pct = total ? ((p.val / total) * 100).toFixed(1) : 0;
    const item = document.createElement("div");
    item.className = "legend-item";
    item.innerHTML = `
      <div class="legend-color" style="background:${p.color}"></div>
      <span><strong>${name}</strong>: ${p.val.toLocaleString()} (${pct}%)</span>
    `;
    legend.appendChild(item);
  });

  return wrap;
}

function renderWaffles(years = [2022, 2023, 2024]) {
  const host = document.getElementById("waffles-container");
  if (!host) return;
  host.innerHTML = "";
  years.forEach(y => {
    const block = buildWaffleBlock(y);
    if (block) host.appendChild(block);
  });
}

function renderContinentsStacked100(stepStart = 1990, step = 5) {
  // pick years every 5 years (1990, 1995, ..., 2025)
  const years = window.YEARS.filter(y => y >= stepStart && ((y - stepStart) % step === 0));
  // ensure we include the last year if it’s not on the step
  const last = window.YEARS[window.YEARS.length - 1];
  if (!years.includes(last) && last > years[years.length - 1]) years.push(last);

  const idx = y => window.YEARS.indexOf(y);
  const pick = name => years.map(y => {
    const i = idx(y);
    const arr = window.DATA[name] || [];
    const v = (i >= 0 && i < arr.length) ? Number(arr[i] || 0) : 0;
    return Number.isFinite(v) ? v : 0;
  });

  const africa  = pick("Africa");
  const amer    = pick("Americas");
  const asiaOc  = pick("Asia_and_Oceania");
  const europe  = pick("Europe");

  const totals = years.map((_, i) => africa[i] + amer[i] + asiaOc[i] + europe[i]);

  const toPct = (arr) => arr.map((v, i) => totals[i] > 0 ? (v / totals[i]) * 100 : 0);

  const dataPct = {
    Africa:  toPct(africa),
    Americas:toPct(amer),
    AsiaOc:  toPct(asiaOc),
    Europe:  toPct(europe),
  };

  const ctx = document.getElementById("continents-canvas");
  if (!ctx || !window.Chart) return;

  // Destroy previous instance if re-rendering
  if (ctx._chart) { ctx._chart.destroy(); }

  const COLORS = {
    Africa:   "#9467bd",
    Americas: "#8c564b",
    AsiaOc:   "#2ca02c",
    Europe:   "#1f77b4",
  };

  ctx._chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: years,
      datasets: [
        { label: "Africa",   data: dataPct.Africa,   backgroundColor: COLORS.Africa,   stack: "share", _abs: africa },
        { label: "Americas", data: dataPct.Americas, backgroundColor: COLORS.Americas, stack: "share", _abs: amer },
        { label: "Asia & Oceania", data: dataPct.AsiaOc, backgroundColor: COLORS.AsiaOc, stack: "share", _abs: asiaOc },
        { label: "Europe",   data: dataPct.Europe,   backgroundColor: COLORS.Europe,   stack: "share", _abs: europe }
      ]
    },
    options: {
      indexAxis: "y",                 // horizontal bars
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top" },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const ds = ctx.dataset;
              const i = ctx.dataIndex;
              const pct = (ctx.raw ?? 0).toFixed(1);
              const abs = (ds._abs?.[i] ?? 0).toLocaleString();
              return `${ds.label}: ${pct}% (${abs})`;
            }
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          min: 0, max: 100,
          ticks: { stepSize: 10, callback: v => v + "%" },
          title: { display: true, text: "Share of world conflict deaths" }
        },
        y: {
          stacked: true,
          title: { display: true, text: "Year (2-year step)" },
          grid: { display: false }
        }
      }
    }
  });
}

const CONT_COLORS = {
  Africa:   "#9467bd",
  Americas: "#8c564b",
  AsiaOc:   "#2ca02c",   // Asia & Oceania
  Europe:   "#1f77b4"
};

function getContinentValuesForYear(year) {
  const idx = window.YEARS.indexOf(Number(year));
  const pick = (arr) => (idx >= 0 && Array.isArray(arr)) ? Number(arr[idx] ?? 0) : 0;
  return {
    Africa:   pick(window.DATA.Africa),
    Americas: pick(window.DATA.Americas),
    AsiaOc:   pick(window.DATA.Asia_and_Oceania),
    Europe:   pick(window.DATA.Europe)
  };
}

// ---- continent bar chart  ----
function renderSimpleContinentBar(year = 2024) {
  const ctx = document.getElementById("abs-canvas");
  if (!ctx || !window.Chart) return;

  const vals = getContinentValuesForYear(year);
  const labels = ["Africa", "Americas", "Asia & Oceania", "Europe"];
  const data   = [vals.Africa, vals.Americas, vals.AsiaOc, vals.Europe];
  const colors = [CONT_COLORS.Africa, CONT_COLORS.Americas, CONT_COLORS.AsiaOc, CONT_COLORS.Europe];

  if (ctx._chart) ctx._chart.destroy();

  ctx._chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: `Deaths in ${year}`,
        data,
        backgroundColor: colors,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (c) => `${c.formattedValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} deaths`
          }
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          ticks: { callback: v => Number(v).toLocaleString() },
          title: { display: true, text: "Deaths (absolute)" }
        }
      }
    }
  });
}

function initSimpleContinentBar(defaultYear = 2024) {
  // initial render
  renderSimpleContinentBar(defaultYear);

  // year buttons
  document.querySelectorAll(".abs-year-btn").forEach(btn => {
    if (Number(btn.dataset.year) === Number(defaultYear)) btn.classList.add("active");
    btn.addEventListener("click", () => {
      document.querySelectorAll(".abs-year-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderSimpleContinentBar(Number(btn.dataset.year));
    });
  });
}
// ---- continent bar chart end ----

// ---- Africa histogram (average per 5-year periods) ----
function renderAfricaHistogram(step = 5, startYear = 1990) {
  const ctx = document.getElementById("africa-hist");
  if (!ctx || !window.Chart) return;

  // znajdź indeks startowy (np. 1990)
  const startIdx = window.YEARS.indexOf(startYear);
  if (startIdx < 0) return;

  const groupedLabels = [];
  const groupedValues = [];

  for (let i = startIdx; i < window.YEARS.length; i += step) {
    const start = window.YEARS[i];
    const end = window.YEARS[Math.min(i + step - 1, window.YEARS.length - 1)];
    const label = `${start}–${end}`;
    const slice = window.DATA.Africa.slice(i, i + step);
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    groupedLabels.push(label);
    groupedValues.push(avg);
  }

  if (ctx._chart) ctx._chart.destroy();

  ctx._chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: groupedLabels,
      datasets: [{
        label: "Average conflict deaths (per 5 years)",
        data: groupedValues,
        backgroundColor: "#9467bd",
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (c) => `${Math.round(c.raw).toLocaleString()} deaths (avg)`
          }
        }
      },
      scales: {
        x: { title: { display: true, text: "5-year period" } },
        y: {
          beginAtZero: true,
          title: { display: true, text: "Average deaths" },
          ticks: { callback: v => v.toLocaleString() }
        }
      }
    }
  });
}

// ---- Africa histogram koniec ----

// ---- Bootstrap once DOM and data are ready ----
document.addEventListener("DOMContentLoaded", () => {
  renderLineChart();
  renderWaffles([2022, 2023, 2024]);
  renderContinentsStacked100(1990,2);
  initSimpleContinentBar(2025);
  renderAfricaHistogram(5,1990);

});
