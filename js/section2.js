
var margin = { top: 80, right: 25, bottom: 30, left: 60 },
    width = 450 - margin.left - margin.right,
    height = 450 - margin.top - margin.bottom;

const monthsOrder = [
    "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
];

// ---------- Function to create one heatmap ----------
function createHeatmap(containerId, countryName, rows) {
    const svg = d3.select(containerId)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    let data = rows.filter(d => d.Country === countryName && monthsOrder.includes(d.MonthShort));
    if (data.length === 0) {
        d3.select(containerId).append("p").text("No data for: " + countryName);
        return;
    }

    const years = Array.from(new Set(data.map(d => d.Year))).sort((a, b) => a - b);

    const grid = [];
    const map = d3.rollup(data, v => d3.sum(v, d => d.Births || 0), d => d.Year, d => d.MonthShort);
    years.forEach(y => {
        monthsOrder.forEach(m => {
            grid.push({
                year: y,
                month: m,
                value: (map.get(y) && map.get(y).get(m)) ?? null
            });
        });
    });

    // Scales
    const x = d3.scaleBand().domain(monthsOrder).range([0, width]).padding(0.05);
    const y = d3.scaleBand().domain(years).range([0, height]).padding(0.05); // ascending top→bottom

    // X axis
    svg.append("g")
        .style("font-size", 12)
        .attr("transform", "translate(0,0)") // top position
        .call(d3.axisTop(x).tickSize(0))
        .select(".domain").remove();

    // Y axis
    svg.append("g")
        .style("font-size", 12)
        .call(d3.axisLeft(y).tickSize(0))
        .select(".domain").remove();

    // Color scale
    const maxVal = d3.max(grid, d => d.value ?? 0) || 1;
    const color = d3.scaleSequential()
        .interpolator(d3.interpolateYlGnBu)
        .domain([0, maxVal]);

    // Tooltip
    const tooltip = d3.select(containerId)
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "solid 1px #999")
        .style("border-radius", "4px")
        .style("padding", "6px 8px")
        .style("pointer-events", "none");

    const mouseover = function (event, d) {
        tooltip.style("opacity", 1);
        d3.select(this).style("stroke", "black").style("opacity", 1);
    };
    const mousemove = function (event, d) {
        tooltip.html(
            `<strong>${countryName}</strong><br/>
         Year: ${d.year}<br/>
         Month: ${d.month}<br/>
         Births: ${d.value ?? "n/a"}`
        )
            .style("left", (event.pageX + 12) + "px")
            .style("top", (event.pageY - 28) + "px");
    };
    const mouseleave = function (event, d) {
        tooltip.style("opacity", 0);
        d3.select(this).style("stroke", "none").style("opacity", 0.9);
    };

    // Draw rectangles
    svg.selectAll("rect.cell")
        .data(grid, d => d.year + ":" + d.month)
        .enter().append("rect")
        .attr("class", "cell")
        .attr("x", d => x(d.month))
        .attr("y", d => y(d.year))
        .attr("rx", 4).attr("ry", 4)
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .style("fill", d => d.value == null ? "#eee" : color(d.value))
        .style("stroke-width", 2)
        .style("stroke", "none")
        .style("opacity", 0.9)
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);

    // Title
    svg.append("text")
        .attr("x", 0).attr("y", -45)
        .attr("text-anchor", "left")
        .style("font-size", "20px")
        .text(`Number of Births — ${countryName}`);

    // Subtitle
    svg.append("text")
        .attr("x", 0).attr("y", -25)
        .attr("text-anchor", "left")
        .style("font-size", "12px")
        .style("fill", "grey")
        .text("Columns: Months, Rows: Years, Color: Births");
}

// ---------- Load and preprocess Eurostat data ----------
d3.csv("./data/data2.csv", function rowParser(d) {
    const monthFull = d["Month"];
    const monthShort = monthFull ? monthFull.substring(0, 3).toUpperCase() : null;
    const birthsRaw = d["OBS_VALUE"];
    const births = (birthsRaw === ":" || birthsRaw === "<null>" || birthsRaw === "" || birthsRaw == null)
        ? null : +birthsRaw;

    return {
        Country: d["Geopolitical entity (reporting)"],
        Month: monthFull,
        MonthShort: monthShort,
        Year: +d["TIME_PERIOD"],
        Births: births
    };
}).then(function (rows) {
    createHeatmap("#heatmap-spain", "Spain", rows);
    createHeatmap("#heatmap-greece", "Greece", rows);
    createHeatmap("#heatmap-italy", "Italy", rows);
});