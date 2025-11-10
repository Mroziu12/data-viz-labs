/**
 * Grouped bar chart TFR w D3.js
 * @param {Object}  opts
 * @param {string}  opts.csvUrl   – ścieżka do CSV
 * @param {string}  opts.container – selektor kontenera (np. '#fertility')
 * @param {Array}   opts.years     – lista lat (np. [1950,1980,2010,2023])
 * @param {Array}   opts.countries – lista krajów LUB kodów (np. ['Europe','RUS','UKR'])
 * @param {number}  [opts.width=900]
 * @param {number}  [opts.height=420]
 * @param {string}  [opts.valueCol='Fertility rate (period), historical']
 */
async function buildFertilityGroupedBarD3({
    csvUrl,
    container,
    years,
    countries,
    width = 900,
    height = 420,
    valueCol = 'Fertility rate (period), historical'
}) {
    const yearsStr = years.map(String);
    const wanted = new Set(countries.map(c => String(c).toLowerCase()));

    // 1) Wczytaj CSV (d3.autoType zrzuci liczby do Number)
    const rows = await d3.csv(csvUrl, d3.autoType);

    // Uwaga: jeśli nagłówek w pliku ma cudzysłowy z powodu przecinka
    // ("Fertility rate (period), historical"), d3.csv usunie je
    // i kolumna będzie dostępna jako valueCol powyżej.

    // 2) Filtrowanie na lata + kraje/kody
    const filtered = rows.filter(r => {
        const byYear = yearsStr.includes(String(r.Year));
        const key = String(r.Entity ?? '').toLowerCase();
        const code = String(r.Code ?? '').toLowerCase();
        const byCountry = wanted.has(key) || wanted.has(code);
        return byYear && byCountry;
    });

    // 3) Budujemy strukturę: [{year, values: {countryLabel: value, ...}}, ...]
    // Etykietę kraju bierzemy z tego, co użytkownik podał (kod lub nazwa) — zachowamy kolejność z 'countries'
    // Mapujemy rzędy do słownika: year -> { countryKey -> value }
    const byYear = d3.rollup(
        filtered,
        v => {
            const m = new Map();
            for (const row of v) {
                // dopasuj do listy 'countries' – jeśli w liście jest kod, etykieta = kod; jeśli nazwa – etykieta = nazwa
                for (const want of countries) {
                    const w = String(want).toLowerCase();
                    if (w === String(row.Code ?? '').toLowerCase() || w === String(row.Entity ?? '').toLowerCase()) {
                        m.set(String(want), row[valueCol] ?? null);
                    }
                }
            }
            return m;
        },
        d => String(d.Year)
    );

    // 4) Dane do wykresu w ustalonej kolejności lat
    const data = yearsStr.map(y => ({
        year: y,
        values: byYear.get(y) || new Map()
    }));

    // 5) Scena SVG
    const margin = { top: 40, right: 20, bottom: 40, left: 56 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    // czyść poprzedni wykres
    d3.select(container).selectAll('svg').remove();

    const svg = d3.select(container)
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('width', '100%')
        .attr('height', '100%');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // 6) Skale
    const x0 = d3.scaleBand()
        .domain(yearsStr)
        .range([0, innerW])
        .paddingInner(0.2);

    const x1 = d3.scaleBand()
        .domain(countries.map(String))
        .range([0, x0.bandwidth()])
        .padding(0.08);

    const maxY = d3.max(data, d =>
        d3.max(countries, c => (d.values.get(String(c)) ?? 0))
    ) ?? 0;

    const y = d3.scaleLinear()
        .domain([0, Math.max(3, Math.ceil(maxY))]) // trochę zapasu
        .nice()
        .range([innerH, 0]);

    const color = d3.scaleOrdinal()
        .domain(countries.map(String))
        .range(d3.schemeTableau10);

    // 7) Osie
    g.append('g')
        .attr('transform', `translate(0,${innerH})`)
        .call(d3.axisBottom(x0));

    g.append('g')
        .call(d3.axisLeft(y));

    g.append('text')
        .attr('x', innerW / 2)
        .attr('y', -12)
        .attr('text-anchor', 'middle')
        .style('font-weight', 600)
        .text('Fertility rate (children per woman)');

    g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -innerH / 2)
        .attr('y', -40)
        .attr('text-anchor', 'middle')
        .text('Children per woman');

    // 8) Grupy słupków (po roku)
    const yearGroups = g.selectAll('.year-group')
        .data(data)
        .enter()
        .append('g')
        .attr('class', 'year-group')
        .attr('transform', d => `translate(${x0(d.year)},0)`);

    // 9) Słupki
    yearGroups.selectAll('rect')
        .data(d => countries.map(c => ({ year: d.year, country: String(c), value: d.values.get(String(c)) ?? null })))
        .enter()
        .append('rect')
        .attr('x', d => x1(d.country))
        .attr('y', d => d.value == null ? y(0) : y(d.value))
        .attr('width', x1.bandwidth())
        .attr('height', d => d.value == null ? 0 : (innerH - y(d.value)))
        .attr('fill', d => color(d.country))
        .append('title')
        .text(d => `${d.country} • ${d.year}: ${d.value == null ? 'no data' : d.value}`);

    // 10) Legenda
    const legend = svg.append('g')
        .attr('transform', `translate(${margin.left},${height - 8})`);

    const leg = legend.selectAll('g')
        .data(countries.map(String))
        .enter()
        .append('g')
        .attr('transform', (d, i) => `translate(${i * 130},-6)`);

    leg.append('rect')
        .attr('width', 14).attr('height', 14)
        .attr('fill', d => color(d));

    leg.append('text')
        .attr('x', 18).attr('y', 11)
        .style('font-size', 12)
        .text(d => d);
}

// 11) PRZYKŁAD UŻYCIA – dopasuj do siebie:
buildFertilityGroupedBarD3({
    csvUrl: './data/children-born-per-woman.csv',
    container: '#fertility',
    years: [1950, 1980, 2010, 2023],
    countries: ['Europe (UN)', 'RUS', 'UKR'] // możesz mieszać nazwy i kody
});