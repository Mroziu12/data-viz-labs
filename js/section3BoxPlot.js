(() => {
    const margin = { top: 40, right: 30, bottom: 80, left: 70 };
    const width = 900 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    const svg = d3.select("#fertility-boxplot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    d3.csv("data/children-born-per-woman-per_continent.csv").then(data => {
        data.forEach(d => d.Fertility = +d.Fertility);

        const grouped = d3.group(data, d => d.Entity);

        // => dodajemy label = canon(continent)
        const stats = Array.from(grouped, ([continent, values]) => {
            const sorted = values.map(v => v.Fertility).sort(d3.ascending);
            const q1 = d3.quantile(sorted, 0.25);
            const median = d3.quantile(sorted, 0.5);
            const q3 = d3.quantile(sorted, 0.75);
            const iqr = q3 - q1;
            const min = d3.max([d3.min(sorted), q1 - 1.5 * iqr]);
            const max = d3.min([d3.max(sorted), q3 + 1.5 * iqr]);
            return { continent, label: canon(continent), q1, median, q3, iqr, min, max };
        });

        const x = d3.scaleBand()
            .domain(stats.map(d => d.label))  // używamy kanonicznych etykiet
            .range([0, width])
            .paddingInner(0.3)
            .paddingOuter(0.2);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.Fertility) + 1])
            .range([height, 0]);

        // --- pudełka ---
        svg.selectAll(".box")
            .data(stats)
            .join("rect")
            .attr("class", "box")
            .attr("x", d => x(d.label))
            .attr("width", x.bandwidth())
            .attr("y", d => y(d.q3))
            .attr("height", d => y(d.q1) - y(d.q3))
            .attr("fill", d => colorScale(d.label))
            .attr("stroke", d => d3.color(colorScale(d.label)).darker(0.8))
            .attr("fill-opacity", 0.75);

        // --- linia mediany ---
        svg.selectAll(".median")
            .data(stats)
            .join("line")
            .attr("x1", d => x(d.label))
            .attr("x2", d => x(d.label) + x.bandwidth())
            .attr("y1", d => y(d.median))
            .attr("y2", d => y(d.median))
            .attr("stroke", d => d3.color(colorScale(d.label)).darker(1.0))
            .attr("stroke-width", 2.5);

        // --- wąsy ---
        svg.selectAll(".whisker-min")
            .data(stats)
            .join("line")
            .attr("x1", d => x(d.label) + x.bandwidth() / 2)
            .attr("x2", d => x(d.label) + x.bandwidth() / 2)
            .attr("y1", d => y(d.min))
            .attr("y2", d => y(d.q1))
            .attr("stroke", "#000");

        svg.selectAll(".whisker-max")
            .data(stats)
            .join("line")
            .attr("x1", d => x(d.label) + x.bandwidth() / 2)
            .attr("x2", d => x(d.label) + x.bandwidth() / 2)
            .attr("y1", d => y(d.max))
            .attr("y2", d => y(d.q3))
            .attr("stroke", "#000");

        // --- kapelusze wąsów ---
        svg.selectAll(".whisker-min-line")
            .data(stats)
            .join("line")
            .attr("x1", d => x(d.label) + x.bandwidth() / 4)
            .attr("x2", d => x(d.label) + 3 * x.bandwidth() / 4)
            .attr("y1", d => y(d.min))
            .attr("y2", d => y(d.min))
            .attr("stroke", "#000");

        svg.selectAll(".whisker-max-line")
            .data(stats)
            .join("line")
            .attr("x1", d => x(d.label) + x.bandwidth() / 4)
            .attr("x2", d => x(d.label) + 3 * x.bandwidth() / 4)
            .attr("y1", d => y(d.max))
            .attr("y2", d => y(d.max))
            .attr("stroke", "#000");

        // --- oś X (niżej + wycentrowane opisy) ---
        const xAxis = svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x)); // etykiety już są kanoniczne

        xAxis.selectAll("text")
            .attr("transform", "rotate(-15)")
            .attr("dy", "1.5em")
            .attr("x", 0)
            .attr("y", 10)
            .style("text-anchor", "middle")
            .style("font-size", "13px");

        // --- oś Y ---
        svg.append("g").call(d3.axisLeft(y));

        // --- etykiety osi ---
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + 60)
            .attr("text-anchor", "middle")
            .attr("font-weight", "500")
            .text("Continent");

        svg.append("text")
            .attr("x", -height / 2)
            .attr("y", -50)
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("font-weight", "500")
            .text("Fertility rate (children per woman)");
    });
})();
