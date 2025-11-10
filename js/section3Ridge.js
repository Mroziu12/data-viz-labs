// ---- WSPÓLNE (bez konfliktów) ----
window.canon = window.canon || function (s) {
    return (s || "")
        .replace(/\(UN\)/gi, "")
        .replace(/Latin America and the Caribbean/gi, "Latin America")
        .replace(/Northern America/gi, "North America")
        .trim();
};

window.CONTINENTS = window.CONTINENTS || ["Africa", "Asia", "Europe", "Latin America", "North America"];

window.COLORS = window.COLORS || {
    "Africa": "#66c2a5",
    "Asia": "#fc8d62",
    "Europe": "#8da0cb",
    "Latin America": "#e78ac3",
    "North America": "#a6d854",
};

window.colorScale = window.colorScale || d3.scaleOrdinal()
    .domain(window.CONTINENTS)
    .range(window.CONTINENTS.map(k => window.COLORS[k]));

// ---- RIDGELINE ----
(() => {
    const margin = { top: 40, right: 30, bottom: 60, left: 120 };
    const width = 900 - margin.left - margin.right;

    d3.csv("data/children-born-per-woman-per_continent.csv").then(data => {
        // Parsowanie
        data.forEach(d => {
            d.Year = +d.Year;
            d.Fertility = +d.Fertility;
        });

        // Grupowanie + kanoniczne etykiety + sort lat
        let groups = Array.from(
            d3.group(data, d => d.Entity),
            ([continent, values]) => ({
                continent,
                label: canon(continent),
                values: values.sort((a, b) => d3.ascending(a.Year, b.Year))
            })
        );

        // Sort wg ustalonej kolejności (fallback: alfabetycznie)
        groups.sort((a, b) => {
            const ia = window.CONTINENTS.indexOf(a.label);
            const ib = window.CONTINENTS.indexOf(b.label);
            return (ia === -1 || ib === -1) ? a.label.localeCompare(b.label) : ia - ib;
        });

        // Wysokość zależna od liczby kontynentów
        const ridgeH = 80, gap = 16;
        const height = groups.length * ridgeH + (groups.length - 1) * gap;

        const svg = d3.select("#fertility-ridgeline")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Skale
        const x = d3.scaleTime()
            .domain(d3.extent(data, d => new Date(d.Year, 0, 1)))
            .range([0, width]);

        const yBand = d3.scaleBand()
            .domain(groups.map(d => d.label))   // kanoniczne nazwy
            .range([0, height])
            .padding(0.45);

        const amp = d3.scaleLinear()
            .domain(d3.extent(data, d => d.Fertility))
            .range([0, yBand.bandwidth() * 0.9]);

        // Generatory
        const area = d3.area()
            .x(d => x(new Date(d.Year, 0, 1)))
            .y0(0)
            .y1(d => -amp(d.Fertility))
            .curve(d3.curveBasis);

        const line = d3.line()
            .x(d => x(new Date(d.Year, 0, 1)))
            .y(d => -amp(d.Fertility))
            .curve(d3.curveBasis);

        // Rysowanie grzbietów (UWAGA: bez .datum(...))
        const ridge = svg.selectAll(".ridge")
            .data(groups)
            .join("g")
            .attr("class", "ridge")
            .attr("transform", d => `translate(0, ${yBand(d.label) + yBand.bandwidth()})`);

        ridge.append("path")
            .attr("class", "area")
            .attr("d", d => area(d.values))
            .attr("fill", d => colorScale(d.label))
            .attr("fill-opacity", 0.85)
            .attr("stroke", d => d3.color(colorScale(d.label)).darker(0.8))
            .attr("stroke-width", 1);

        ridge.append("path")
            .attr("class", "outline")
            .attr("d", d => line(d.values))
            .attr("fill", "none")
            .attr("stroke", d => d3.color(colorScale(d.label)).darker(1.0))
            .attr("stroke-width", 1.2);

        // Osie
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).ticks(8));

        svg.append("g")
            .call(d3.axisLeft(yBand)); // etykiety to już kanoniczne nazwy

        // Podpis X
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + 45)
            .attr("text-anchor", "middle")
            .attr("font-weight", "500")
            .text("Year");
    });
})();
