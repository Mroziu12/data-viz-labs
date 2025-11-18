// ---------------------------------------------------
// STREAMGRAPH WITH LEGEND
// ---------------------------------------------------

// Bigger canvas
var margin = { top: 30, right: 40, bottom: 40, left: 80 },
    width = 1200 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

// Create SVG inside centered container
var svg = d3.select("#births-stream")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Load CSV + convert strings → numbers
d3.csv("data/births_wide.csv", function (d) {
    return {
        Year: +d.Year,
        "Africa (UN)": +d["Africa (UN)"],
        "Asia (UN)": +d["Asia (UN)"],
        "Europe (UN)": +d["Europe (UN)"],
        "Latin America (UN)": +d["Latin America (UN)"],
        "Northern America (UN)": +d["Northern America (UN)"]
    };
}).then(function (data) {

    // Region names = CSV header except the first column
    var keys = data.columns.slice(1);

    // X scale
    var x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.Year))
        .range([0, width]);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(
            d3.axisBottom(x)
                .ticks(10)
                .tickFormat(d3.format("d"))   // <-- no separators
        );


    // Stack the data for streamgraph
    var stackedData = d3.stack()
        .keys(keys)
        .offset(d3.stackOffsetNone)
        (data);

    // Dynamic Y scale based on stacked layers
    // Natural streamgraph proportions (correct looking)
    var y = d3.scaleLinear()
        .domain([
            d3.min(stackedData, layer => d3.min(layer, d => d[0])),
            d3.max(stackedData, layer => d3.max(layer, d => d[1]))
        ])
        .range([height, 0]);

    svg.append("g")
        .call(
            d3.axisLeft(y)
                .tickFormat(d => (d / 1_000_000) + "M")
        );


    // Color palette
    var color = d3.scaleOrdinal()
        .domain(keys)
        .range(['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00']);

    // Draw the streamgraph areas
    svg.selectAll("mylayers")
        .data(stackedData)
        .enter()
        .append("path")
        .style("fill", d => color(d.key))
        .attr("d", d3.area()
            .x(d => x(d.data.Year))
            .y0(d => y(d[0]))
            .y1(d => y(d[1]))
        );

    //LEGEND

    var legend = svg.append("g")
        .attr("class", "legend-box")
        .attr("transform", "translate(10, 10)");

    legend.append("rect")
        .attr("x", -8)
        .attr("y", -8)
        .attr("width", 160)     // smaller box
        .attr("height", keys.length * 18 + 12)
        .attr("rx", 6)
        .attr("fill", "white")
        .attr("opacity", 0.8);

    var legendItems = legend.selectAll(".legend_item")
        .data(keys)
        .enter()
        .append("g")
        .attr("class", "legend_item")
        .attr("transform", (d, i) => "translate(0," + (i * 18) + ")");

    // smaller color squares
    legendItems.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 12)
        .attr("height", 12)
        .style("fill", d => color(d));

    // smaller text
    legendItems.append("text")
        .attr("x", 18)
        .attr("y", 10)
        .style("font-size", "12px")
        .style("fill", "#333")
        .text(d => d.length > 28 ? d.slice(0, 28) + "…" : d);

});
