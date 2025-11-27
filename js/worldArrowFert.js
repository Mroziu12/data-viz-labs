
document.addEventListener("DOMContentLoaded", function () {

    // ---------- CONFIG ----------
    const width = 1100;
    const height = 550;

    let deathsData = {};
    let years = [];
    let currentYear = null;

    let svg, g, projection, path, tooltip;

    console.log("Cartogram: initialization starting...");

    // Fonction pour créer le path d'une flèche - DÉPLACÉE EN HAUT
    function createArrowPath(size, isPositive) {
        if (isPositive) {
            // Flèche vers le HAUT (value > 0)
            return [
                [0, -size],           // Pointe en haut
                [-size/2, -size/3],   // Coin inférieur gauche
                [-size/4, -size/3],   // Base gauche
                [-size/4, size/2],    // Extrémité basse gauche
                [size/4, size/2],     // Extrémité basse droite
                [size/4, -size/3],    // Base droite
                [size/2, -size/3]     // Coin inférieur droit
            ];
        } else {
            // Flèche vers le BAS (value < 0)
            return [
                [0, size/2],          // Pointe en bas
                [-size/2, size/6],    // Coin supérieur gauche
                [-size/4, size/6],    // Base gauche
                [-size/4, -size/2],   // Extrémité haute gauche
                [size/4, -size/2],    // Extrémité haute droite
                [size/4, size/6],     // Base droite
                [size/2, size/6]      // Coin supérieur droit
            ];
        }
    }

    // Fonction pour créer une flèche de légende
    function createLegendArrow(containerId, isPositive) {
        const container = d3.select(containerId);
        container.html(""); // Nettoyer le contenu existant
        
        const legendSvg = container.append("svg")
            .attr("width", 40)
            .attr("height", 40);
        
        const legendG = legendSvg.append("g")
            .attr("transform", "translate(20,20)"); // Centrer dans le conteneur
        
        const size = 15; // Taille fixe pour la légende
        const points = createArrowPath(size, isPositive);
        const pathString = d3.line()(points);
        
        legendG.append("path")
            .attr("d", pathString)
            .attr("fill", isPositive ? "#ca0020" : "#0571b0")
            .attr("stroke", "#333")
            .attr("stroke-width", 0.5);
    }

    // Remplacer cette partie du code
    Promise.all([
        d3.json("data/world.geojson"),
        d3.csv("data/fertility_rate_countries_N_-_N-1_only_wide.csv")
    ]).then(([world, csv]) => {

        console.log("Cartogram: Data loaded", csv);

        // Process deaths CSV - CORRECTION ICI
        csv.forEach(row => {
            const countryName = row.Countries?.trim(); // Utiliser Countries au lieu de Code
            const year = +row.Year;
            const deaths = +row.Values || 0; // Utiliser Values directement

            if (!deathsData[countryName]) deathsData[countryName] = {};
            deathsData[countryName][year] = deaths;
        });

        years = [...new Set(csv.map(d => +d.Year))].sort((a, b) => a - b);
        currentYear = years[years.length - 1];

        buildCartogram(world);

        // Créer les flèches de légende
        createLegendArrow("#legend-arrow-up", true);
        createLegendArrow("#legend-arrow-down", false);

        // ⭐ FIX: Delay slider setup so the new HTML exists
        requestAnimationFrame(() => {
            setupSlider();
            drawArrows(currentYear);
        });
    });



    // ---------- BUILD BASE MAP ----------
    function buildCartogram(world) {

        d3.select("#worldArrow-container").html("");

        svg = d3.select("#worldArrow-container")
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



    // ---------- DRAW ARROWS ----------
    function drawArrows(year) {

        console.log("Drawing arrows for", year);

        g.selectAll(".carto-arrow").remove();

        const features = g.selectAll("path").data();

        const dataset = features.map(f => {
            const countryName = f.properties.name;
            const deaths = deathsData[countryName]?.[year] || 0;
            const [x, y] = path.centroid(f);

            return { 
                code: f.id, 
                name: countryName, 
                x, y, 
                deaths 
            };
        });

        const maxDeaths = d3.max(dataset, d => Math.abs(d.deaths)) || 1;

        const arrowSize = d3.scaleSqrt()
            .domain([0, maxDeaths])
            .range([0, 25]);

        // Filtrer les données avec des valeurs significatives
        const filteredData = dataset.filter(d => Math.abs(d.deaths) > 0.001);
        
        console.log(`Drawing ${filteredData.length} arrows for year ${year}`);

        g.selectAll("path.arrow")
            .data(filteredData)
            .enter()
            .append("path")
            .attr("class", "carto-arrow")
            .attr("d", d => {
                const size = arrowSize(Math.abs(d.deaths));
                const isPositive = d.deaths > 0;
                const points = createArrowPath(size, isPositive);
                return d3.line()(points);
            })
            .attr("transform", d => `translate(${d.x}, ${d.y})`)
            // CORRECTION COULEURS : Rouge pour >0, Bleu pour <0
            .attr("fill", d => d.deaths > 0 ? "#ca0020" : "#0571b0")
            .attr("stroke", "#333")
            .attr("stroke-width", 0.5)
            .style("cursor", "pointer")
            .on("mouseover", (event, d) => {
                tooltip.style("opacity", 1);
                tooltip.html(`
                    <strong>${d.name}</strong><br>
                    Value: ${d.deaths.toFixed(4)}<br>
                    Year: ${year}<br>
                    Trend: ${d.deaths > 0 ? '↑ Increase' : '↓ Decrease'}
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

        const slider = document.getElementById("worldArrow-year");
        const label = document.getElementById("worldArrow-year-label");

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
            drawArrows(y);
        });
    }

});
