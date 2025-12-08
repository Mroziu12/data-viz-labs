document.addEventListener('DOMContentLoaded', function() {
    console.log("networkGraph.js chargé");
    
    // Données d'émigration
    const rawData = [
        {Entity: "Africa", Code: "", Year: 1990, "Emigrants from Ukraine: Where did they move to?": 4903},
        {Entity: "Africa", Code: "", Year: 1995, "Emigrants from Ukraine: Where did they move to?": 5020},
        {Entity: "Africa", Code: "", Year: 2000, "Emigrants from Ukraine: Where did they move to?": 5161},
        {Entity: "Africa", Code: "", Year: 2005, "Emigrants from Ukraine: Where did they move to?": 4954},
        {Entity: "Africa", Code: "", Year: 2010, "Emigrants from Ukraine: Where did they move to?": 4619},
        {Entity: "Africa", Code: "", Year: 2015, "Emigrants from Ukraine: Where did they move to?": 1908},
        {Entity: "Africa", Code: "", Year: 2020, "Emigrants from Ukraine: Where did they move to?": 3934},
        {Entity: "Africa", Code: "", Year: 2025, "Emigrants from Ukraine: Where did they move to?": 3498},
        {Entity: "Asia", Code: "", Year: 1990, "Emigrants from Ukraine: Where did they move to?": 728404},
        {Entity: "Asia", Code: "", Year: 1995, "Emigrants from Ukraine: Where did they move to?": 598327},
        {Entity: "Asia", Code: "", Year: 2000, "Emigrants from Ukraine: Where did they move to?": 479754},
        {Entity: "Asia", Code: "", Year: 2005, "Emigrants from Ukraine: Where did they move to?": 447053},
        {Entity: "Asia", Code: "", Year: 2010, "Emigrants from Ukraine: Where did they move to?": 412533},
        {Entity: "Asia", Code: "", Year: 2015, "Emigrants from Ukraine: Where did they move to?": 414624},
        {Entity: "Asia", Code: "", Year: 2020, "Emigrants from Ukraine: Where did they move to?": 434494},
        {Entity: "Asia", Code: "", Year: 2025, "Emigrants from Ukraine: Where did they move to?": 493476},
        {Entity: "Europe", Code: "", Year: 1990, "Emigrants from Ukraine: Where did they move to?": 4543901},
        {Entity: "Europe", Code: "", Year: 1995, "Emigrants from Ukraine: Where did they move to?": 4606294},
        {Entity: "Europe", Code: "", Year: 2000, "Emigrants from Ukraine: Where did they move to?": 4648698},
        {Entity: "Europe", Code: "", Year: 2005, "Emigrants from Ukraine: Where did they move to?": 4534465},
        {Entity: "Europe", Code: "", Year: 2010, "Emigrants from Ukraine: Where did they move to?": 4338981},
        {Entity: "Europe", Code: "", Year: 2015, "Emigrants from Ukraine: Where did they move to?": 3776620},
        {Entity: "Europe", Code: "", Year: 2020, "Emigrants from Ukraine: Where did they move to?": 3419418},
        {Entity: "Europe", Code: "", Year: 2025, "Emigrants from Ukraine: Where did they move to?": 8707148},
        {Entity: "North America", Code: "", Year: 1990, "Emigrants from Ukraine: Where did they move to?": 225880},
        {Entity: "North America", Code: "", Year: 1995, "Emigrants from Ukraine: Where did they move to?": 271876},
        {Entity: "North America", Code: "", Year: 2000, "Emigrants from Ukraine: Where did they move to?": 324687},
        {Entity: "North America", Code: "", Year: 2005, "Emigrants from Ukraine: Where did they move to?": 389856},
        {Entity: "North America", Code: "", Year: 2010, "Emigrants from Ukraine: Where did they move to?": 398941},
        {Entity: "North America", Code: "", Year: 2015, "Emigrants from Ukraine: Where did they move to?": 425937},
        {Entity: "North America", Code: "", Year: 2020, "Emigrants from Ukraine: Where did they move to?": 469887},
        {Entity: "North America", Code: "", Year: 2025, "Emigrants from Ukraine: Where did they move to?": 534580},
        {Entity: "Oceania", Code: "", Year: 1990, "Emigrants from Ukraine: Where did they move to?": 18384},
        {Entity: "Oceania", Code: "", Year: 1995, "Emigrants from Ukraine: Where did they move to?": 18034},
        {Entity: "Oceania", Code: "", Year: 2000, "Emigrants from Ukraine: Where did they move to?": 17881},
        {Entity: "Oceania", Code: "", Year: 2005, "Emigrants from Ukraine: Where did they move to?": 17940},
        {Entity: "Oceania", Code: "", Year: 2010, "Emigrants from Ukraine: Where did they move to?": 17626},
        {Entity: "Oceania", Code: "", Year: 2015, "Emigrants from Ukraine: Where did they move to?": 18699},
        {Entity: "Oceania", Code: "", Year: 2020, "Emigrants from Ukraine: Where did they move to?": 19291},
        {Entity: "Oceania", Code: "", Year: 2025, "Emigrants from Ukraine: Where did they move to?": 22988},
        {Entity: "South America", Code: "", Year: 1990, "Emigrants from Ukraine: Where did they move to?": 7518},
        {Entity: "South America", Code: "", Year: 1995, "Emigrants from Ukraine: Where did they move to?": 7979},
        {Entity: "South America", Code: "", Year: 2000, "Emigrants from Ukraine: Where did they move to?": 7409},
        {Entity: "South America", Code: "", Year: 2005, "Emigrants from Ukraine: Where did they move to?": 7027},
        {Entity: "South America", Code: "", Year: 2010, "Emigrants from Ukraine: Where did they move to?": 6524},
        {Entity: "South America", Code: "", Year: 2015, "Emigrants from Ukraine: Where did they move to?": 6223},
        {Entity: "South America", Code: "", Year: 2020, "Emigrants from Ukraine: Where did they move to?": 6007},
        {Entity: "South America", Code: "", Year: 2025, "Emigrants from Ukraine: Where did they move to?": 7526}
    ];

    // Vérifier si le conteneur existe
    const container = document.getElementById('networkGraph');
    if (!container) {
        console.error("Container #networkGraph non trouvé");
        return;
    }
    
    // Configuration
    const width = container.clientWidth || 800;
    const height = 600;
    const center = { x: width / 2, y: height / 2 };

    // Créer le SVG
    const svg = d3.select("#networkGraph")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    // Créer un tooltip
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "rgba(0, 0, 0, 0.8)")
        .style("color", "white")
        .style("padding", "8px")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("z-index", 1000);

    // Fonction pour formater les grands nombres
    function formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(2) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    // Fonction pour créer les données du graphique
    function createGraphData(year, selectedContinent = "all") {
        const filteredData = rawData.filter(d => d.Year === year);
        
        // Créer les nodes
        const nodes = [
            { id: "Ukraine", type: "source", x: center.x, y: center.y }
        ];
        
        // Ajouter les continents comme nodes
        filteredData.forEach(d => {
            if (selectedContinent === "all" || d.Entity === selectedContinent) {
                nodes.push({
                    id: d.Entity,
                    type: "continent",
                    value: d["Emigrants from Ukraine: Where did they move to?"]
                });
            }
        });
        
        // Créer les liens
        const links = [];
        filteredData.forEach(d => {
            if (selectedContinent === "all" || d.Entity === selectedContinent) {
                links.push({
                    source: "Ukraine",
                    target: d.Entity,
                    value: d["Emigrants from Ukraine: Where did they move to?"]
                });
            }
        });
        
        return { nodes, links };
    }

    // Fonction pour positionner les nodes en cercle
    function positionNodes(nodes) {
        const continents = nodes.filter(d => d.type === "continent");
        const angleStep = (2 * Math.PI) / continents.length;
        
        const radius = Math.min(width, height) * 0.3;
        
        continents.forEach((node, i) => {
            const angle = i * angleStep - Math.PI / 2;
            node.x = center.x + radius * Math.cos(angle);
            node.y = center.y + radius * Math.sin(angle);
        });
    }

    // Fonction pour dessiner le graphique
    function drawGraph(year, selectedContinent = "all") {
        console.log(`Dessin du graphique pour l'année ${year}`);
        svg.selectAll("*").remove(); // Nettoyer le SVG
        
        const graphData = createGraphData(year, selectedContinent);
        if (graphData.nodes.length <= 1) {
            console.warn("Pas de données pour cette année");
            return;
        }
        
        positionNodes(graphData.nodes);
        
        // Échelle pour les rayons des cercles
        const maxValue = d3.max(graphData.nodes.filter(d => d.type === "continent"), d => d.value) || 1;
        const radiusScale = d3.scaleSqrt()
            .domain([0, maxValue])
            .range([20, 100]);
        
        // Dessiner les liens
        const links = svg.selectAll(".link")
            .data(graphData.links)
            .enter()
            .append("line")
            .attr("class", "link")
            .attr("x1", d => {
                const source = graphData.nodes.find(n => n.id === d.source);
                return source ? source.x : center.x;
            })
            .attr("y1", d => {
                const source = graphData.nodes.find(n => n.id === d.source);
                return source ? source.y : center.y;
            })
            .attr("x2", d => {
                const target = graphData.nodes.find(n => n.id === d.target);
                return target ? target.x : center.x;
            })
            .attr("y2", d => {
                const target = graphData.nodes.find(n => n.id === d.target);
                return target ? target.y : center.y;
            })
            .attr("stroke", "#CA7C5C")
            .attr("stroke-width", d => Math.sqrt(d.value) / 100)
            .attr("stroke-opacity", 0.6)
            .on("mouseover", function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(`<strong>${d.target}</strong><br/>Émigrants: ${d.value.toLocaleString()}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
        
        // Dessiner les nodes
        const nodes = svg.selectAll(".node")
            .data(graphData.nodes)
            .enter()
            .append("g")
            .attr("class", d => `node ${d.type}`)
            .attr("transform", d => `translate(${d.x},${d.y})`);
        
        // Ajouter les cercles pour les nodes
        nodes.append("circle")
            .attr("r", d => {
                if (d.type === "source") return 40;
                return radiusScale(d.value);
            })
            .attr("fill", d => {
                if (d.type === "source") return "#EED7C5";
                return "#B36A5E";
            })
            .attr("stroke", "#fff")
            .attr("stroke-width", 2)
            .on("mouseover", function(event, d) {
                if (d.type === "continent") {
                    tooltip.transition()
                        .duration(200)
                        .style("opacity", .9);
                    tooltip.html(`<strong>${d.id}</strong><br/>Émigrants: ${d.value.toLocaleString()}`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                }
            })
            .on("mouseout", function() {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
        
        // Ajouter les labels
        nodes.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", d => {
                if (d.type === "source") return 5;
                return radiusScale(d.value) + 25;
            })
            .style("fill", "#333")
            .style("font-weight", "bold")
            .style("font-size", d => {
                if (d.type === "source") return "18px";
                return "14px";
            })
            .style("pointer-events", "none")
            .html(d => {
                if (d.type === "source") return d.id;
                return `<tspan x="0" dy="-0.6em">${d.id}</tspan><tspan x="0" dy="1.2em">${formatNumber(d.value)}</tspan>`;
            });
    }

    // Fonction pour envelopper le texte
    function wrap(text, width) {
        text.each(function() {
            const text = d3.select(this);
            const words = text.text().split('\n');
            text.text(null);
            
            words.forEach((word, i) => {
                text.append("tspan")
                    .attr("x", 0)
                    .attr("dy", i === 0 ? "0em" : "1.2em")
                    .text(word);
            });
        });
    }

    // Vérifier et initialiser le slider
    const yearSlider = document.getElementById('yearSlider-networkGraph');
    const yearDisplayNetworkGraph = document.getElementById('yearDisplay-networkGraph');
    
    if (yearSlider && yearDisplayNetworkGraph) {
        console.log("Slider trouvé");
        
        // Initialiser le graphique avec la valeur initiale du slider
        const initialYear = parseInt(yearSlider.value);
        yearDisplayNetworkGraph.textContent = initialYear;
        drawGraph(initialYear);
        
        // Gérer les événements du slider
        yearSlider.addEventListener('input', function() {
            const year = parseInt(this.value);
            yearDisplayNetworkGraph.textContent = year;
            drawGraph(year);
        });
    } else {
        console.warn("Slider non trouvé, initialisation avec année par défaut");
        drawGraph(1990);
    }

    // Redessiner le graphique lors du redimensionnement de la fenêtre
    window.addEventListener('resize', function() {
        const currentYear = yearSlider ? parseInt(yearSlider.value) : 1990;
        drawGraph(currentYear);
    });
});