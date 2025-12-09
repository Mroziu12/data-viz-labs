// js/section6.js

// 1. Setup Dimensions
const margin6 = { top: 20, right: 150, bottom: 20, left: 50 };
const width6 = 1000 - margin6.left - margin6.right;
const height6 = 500 - margin6.top - margin6.bottom;

const svg6 = d3.select("#sankey-container")
    .append("svg")
    .attr("width", width6 + margin6.left + margin6.right)
    .attr("height", height6 + margin6.top + margin6.bottom)
    .append("g")
    .attr("transform", `translate(${margin6.left},${margin6.top})`);

// 2. Load Data

Promise.all([
    d3.csv("data/births_wide.csv"),               
    d3.csv("data/children-born-per-woman-per_continent.csv") 
]).then(([birthsData, fertilityData]) => {

    const targetYear = "2023"; 

    const yearBirths = birthsData.find(d => d.Year === targetYear);
    
    const regions = Object.keys(yearBirths).filter(k => k !== "Year" && k !== "Code" && k !== "Entity");
    const birthFlows = regions.map(region => ({
        region: region.replace(" (UN)", ""), 
        count: +yearBirths[region]
    }));

    const totalBirths = d3.sum(birthFlows, d => d.count);

    //  Process Fertility Data (Long Format into Map) 

    const fertilityMap = {};
    fertilityData.filter(d => d.Year === targetYear).forEach(d => {
        let name = d.Entity.replace(" (UN)", "");
        fertilityMap[name] = d.Fertility;
    });

    //  Sankey Graph Structure 
    const nodes = [];
    const links = [];

    // Node 0 is "World"
    nodes.push({ name: "Global Births (" + targetYear + ")" });

    // Create Nodes for each Continent and Links from World to Continent
    birthFlows.forEach((d, i) => {
        nodes.push({ name: d.region });
        links.push({
            source: 0,              // World
            target: i + 1,          // Continent Index
            value: d.count,
            fertility: fertilityMap[d.region] || "N/A" // Attach fertility for tooltip
        });
    });

    // 3. Sankey Generator
    const sankey = d3.sankey()
        .nodeWidth(20)
        .nodePadding(40)
        .extent([[0, 0], [width6, height6]]);

    const { nodes: graphNodes, links: graphLinks } = sankey({
        nodes: nodes.map(d => Object.assign({}, d)),
        links: links.map(d => Object.assign({}, d))
    });

    // 4. Draw Links
    svg6.append("g")
        .selectAll("path")
        .data(graphLinks)
        .enter().append("path")
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("fill", "none")
        .attr("stroke", "#000")
        .attr("stroke-opacity", 0.2)
        .attr("stroke-width", d => Math.max(1, d.width))
        .sort((a, b) => b.width - a.width)
        .on("mouseover", function(event, d) {
            d3.select(this).attr("stroke-opacity", 0.5);
            // Tooltip Logic
            showTooltip6(event, d.target.name, d.value, d.fertility);
        })
        .on("mouseout", function() {
            d3.select(this).attr("stroke-opacity", 0.2);
            hideTooltip6();
        });

    // 5. Draw Nodes
    const node = svg6.append("g")
        .selectAll("rect")
        .data(graphNodes)
        .enter().append("g");

    node.append("rect")
        .attr("x", d => d.x0)
        .attr("y", d => d.y0)
        .attr("height", d => d.y1 - d.y0)
        .attr("width", d => d.x1 - d.x0)
        .attr("fill", (d, i) => i === 0 ? "#333" : d3.schemeCategory10[i % 10])
        .attr("opacity", 0.8);

    // 6. Add Labels
    node.append("text")
        .attr("x", d => d.x0 < width6 / 2 ? d.x1 + 6 : d.x0 - 6)
        .attr("y", d => (d.y1 + d.y0) / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", d => d.x0 < width6 / 2 ? "start" : "end")
        .text(d => d.name)
        .style("font-size", "14px")
        .style("font-weight", "bold");

    // Add Values to Labels
    node.append("text")
        .attr("x", d => d.x0 < width6 / 2 ? d.x1 + 6 : d.x0 - 6)
        .attr("y", d => (d.y1 + d.y0) / 2 + 15) // Offset below name
        .attr("dy", "0.35em")
        .attr("text-anchor", d => d.x0 < width6 / 2 ? "start" : "end")
        .text(d => {
            if (d.value) return (d.value / 1e6).toFixed(1) + "M"; // Show Millions
            return "";
        })
        .style("font-size", "12px")
        .style("fill", "#666");

}).catch(err => console.error("Error loading data for Sankey:", err));

// Simple Tooltip Helper
const tooltip6 = d3.select("body").append("div")
    .attr("class", "tooltip-sankey")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background", "white")
    .style("padding", "8px")
    .style("border", "1px solid #ccc")
    .style("border-radius", "4px")
    .style("pointer-events", "none");

function showTooltip6(event, region, births, fertility) {
    tooltip6.transition().duration(200).style("opacity", .9);
    tooltip6.html(
        `<strong>${region}</strong><br/>` +
        `Births: ${(births / 1e6).toFixed(2)} Million<br/>` +
        `Fertility Rate: ${fertility}`
    )
    .style("left", (event.pageX + 10) + "px")
    .style("top", (event.pageY - 28) + "px");
}

function hideTooltip6() {
    tooltip6.transition().duration(500).style("opacity", 0);
}