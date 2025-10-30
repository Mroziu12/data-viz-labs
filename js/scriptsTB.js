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

// ---- Bootstrap once DOM and data are ready ----
document.addEventListener("DOMContentLoaded", () => {
  renderLineChart();
  renderWaffles([2022, 2023, 2024]);
});
