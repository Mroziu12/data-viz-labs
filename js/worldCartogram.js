document.addEventListener("DOMContentLoaded", function () {

    // ---------- CONFIG ----------
    const width = 1100;
    const height = 550;

    let deathsData = {};
    let years = [];
    let currentYear = null;

    let svg, g, projection, path, tooltip;

    console.log("Cartogram: initialization starting...");


    // ---------- LOAD ALL DATA ----------
    Promise.all([
        d3.json("data/world.geojson"),
        d3.csv("data/deaths-in-armed-conflicts-by-country.csv")
    ]).then(([world, csv]) => {

        console.log("Cartogram: Data loaded", csv);

        // Process deaths CSV
        csv.forEach(row => {
            const code = row.Code?.trim();
            const year = +row.Year;

            const deathCol = Object.keys(row).find(k => k.toLowerCase().includes("deaths"));
            const deaths = +row[deathCol] || 0;

            if (!deathsData[code]) deathsData[code] = {};
            deathsData[code][year] = deaths;
        });

        years = [...new Set(csv.map(d => +d.Year))].sort((a, b) => a - b);
        currentYear = years[years.length - 1];

        buildCartogram(world);

        // ⭐ FIX: Delay slider setup so the new HTML exists
        requestAnimationFrame(() => {
            setupSlider();
            drawCircles(currentYear);
        });
    });



    // ---------- BUILD BASE MAP ----------
    function buildCartogram(world) {

        d3.select("#cartogram-container").html("");

        svg = d3.select("#cartogram-container")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        g = svg.append("g");

        tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        projection = d3.geoNaturalEarth1()
            .scale(width / 6.5)
            .translate([width / 2, height / 2]);

        path = d3.geoPath().projection(projection);

        console.log("Cartogram: drawing map...");

        g.selectAll("path")
            .data(world.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("fill", "#e6e6e6")
            .attr("stroke", "#777")
            .attr("stroke-width", 0.5);
    }



    // ---------- DRAW CIRCLES ----------
    function drawCircles(year) {

        console.log("Drawing circles for", year);

        g.selectAll(".carto-circle").remove();

        const features = g.selectAll("path").data();

        const dataset = features.map(f => {
            const code = f.id;
            const deaths = deathsData[code]?.[year] || 0;
            const [x, y] = path.centroid(f);

            return { code, name: f.properties.name, x, y, deaths };
        });

        const maxDeaths = d3.max(dataset, d => d.deaths) || 1;

        const radius = d3.scaleSqrt()
            .domain([0, maxDeaths])
            .range([0, 35]);

        const color = d3.scaleSequential()
            .domain([0, maxDeaths])
            .interpolator(d3.interpolateOrRd);

        g.selectAll("circle")
            .data(dataset)
            .enter()
            .append("circle")
            .attr("class", "carto-circle")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("r", d => radius(d.deaths))
            .attr("fill", d => d.deaths === 0 ? "transparent" : color(d.deaths))
            .attr("stroke", d => d.deaths === 0 ? "none" : "#333")
            .attr("stroke-width", 0.4)
            .style("cursor", "pointer")
            .on("mouseover", (event, d) => {
                tooltip.style("opacity", 1);
                tooltip.html(`
                    <strong>${d.name}</strong><br>
                    Deaths: ${d.deaths.toLocaleString()}<br>
                    Year: ${year}
                `);
            })
            .on("mousemove", (event) => {
                tooltip.style("left", event.pageX + 10 + "px")
                       .style("top", event.pageY - 28 + "px");
            })
            .on("mouseout", () => {
                tooltip.style("opacity", 0);
            });
    }



    // ---------- SLIDER ----------
    function setupSlider() {

        const slider = document.getElementById("cartogram-year");
        const label = document.getElementById("cartogram-year-label");

        if (!slider || !label) {
            console.error(" Slider HTML not found.");
            return;
        }

        slider.min = years[0];
        slider.max = years[years.length - 1];
        slider.value = currentYear;
        label.textContent = currentYear;

        slider.addEventListener("input", () => {
            const y = +slider.value;
            currentYear = y;
            label.textContent = y;
            drawCircles(y);
        });
    }

});
