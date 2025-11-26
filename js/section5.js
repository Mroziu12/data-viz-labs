document.addEventListener('DOMContentLoaded', function() {

   // Configuration
   const config = {
      width: 800,
      height: 500,
      targetYear: "1950",
      minYear: 1950,
      maxYear: 2023
   };

   // Data storage
   let countryDataMap = new Map();
   let allData = [];
   let currentYear = config.targetYear;

   // Éléments DOM
   let svg, g, tooltip, colorScale, projection, path, zoom;

   async function initializeMap() {
      try {
            console.log("Starting map initialization...");
            
            // Vider le conteneur #map
            d3.select("#map").html("");
            
            // Créer un conteneur principal avec disposition en colonne
            const container = d3.select("#map")
               .style("display", "flex")
               .style("flex-direction", "column")
               .style("align-items", "center")
               .style("gap", "20px");

            // Créer le slider AU-DESSUS de la map
            createSlider(container);
            
            // Créer le conteneur pour la map
            const mapContainer = container
               .append("div")
               .style("width", config.width + "px")
               .style("height", config.height + "px")
               .style("position", "relative"); // Pour le positionnement

            // Créer le SVG pour la map
            svg = mapContainer
               .append("svg")
               .attr("width", config.width)
               .attr("height", config.height)
               .style("cursor", "grab"); // Curseur pour indiquer le déplacement

            g = svg.append("g");
            tooltip = d3.select("body").append("div")
               .attr("class", "tooltip")
               .style("opacity", 0);

            colorScale = d3.scaleThreshold()
               .domain([2, 4, 6, 8, 10])
               .range(["#edf8e9", "#bae4b3", "#74c476", "#31a354", "#006d2c"]);

            console.log("Loading data...");

            // Load both datasets
            const [world, csvData] = await Promise.all([
               d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"),
               d3.csv("data/fertility_rate_countries_only_wide.csv")
            ]);

            console.log("CSV data loaded:", csvData);
            allData = csvData;

            // Initialiser la projection et le path
            projection = d3.geoNaturalEarth1()
               .scale(config.width / 6.3)
               .translate([config.width / 2, config.height / 2]);

            path = d3.geoPath().projection(projection);

            // Configurer le zoom
            setupZoom();

            // Charger les données initiales pour 1950
            updateDataForYear(currentYear);
            
            // Dessiner la carte initiale
            drawMap(world);

      } catch (error) {
            console.error("Error:", error);
            d3.select("#map").html(`
               <div style="text-align: center; color: red; padding: 20px;">
                  <h3>Erreur de chargement</h3>
                  <p>${error.message}</p>
                  <p>Vérifie que ton fichier CSV est accessible.</p>
               </div>
            `);
      }
   }

   function setupZoom() {
      // Définir le comportement de zoom
      zoom = d3.zoom()
         .scaleExtent([1, 8]) // Limites du zoom: 1x à 8x
         .translateExtent([[0, 0], [config.width, config.height]]) // Limites du déplacement
         .on('zoom', function(event) {
            // Appliquer la transformation de zoom au groupe
            g.attr('transform', event.transform);
            
            // Ajuster l'épaisseur des traits pendant le zoom
            g.selectAll("path")
               .attr("stroke-width", 0.5 / event.transform.k); // Traits plus fins quand zoomé
         });

      // Appliquer le zoom au SVG
      svg.call(zoom)
         .on("dblclick.zoom", null); // Désactiver le zoom double-clic si souhaité

      // Ajouter un bouton de reset zoom
      addZoomResetButton();
   }

   function addZoomResetButton() {
      // Créer un bouton de reset
      const resetButton = d3.select("#map")
         .select("div:last-child") // Sélectionner le conteneur de la map
         .append("button")
         .text("⟲ Reset Zoom")
         .style("position", "absolute")
         .style("top", "10px")
         .style("right", "10px")
         .style("padding", "5px 10px")
         .style("background", "white")
         .style("border", "1px solid #ccc")
         .style("border-radius", "4px")
         .style("cursor", "pointer")
         .style("font-size", "12px")
         .style("z-index", "10")
         .on("click", function() {
            resetZoom();
         });

      // Ajouter des indications pour l'utilisateur
      const zoomHint = d3.select("#map")
         .select("div:last-child")
         .append("div")
         .style("position", "absolute")
         .style("bottom", "10px")
         .style("left", "10px")
         .style("background", "rgba(255,255,255,0.8)")
         .style("padding", "5px 10px")
         .style("border-radius", "4px")
         .style("font-size", "11px")
         .style("color", "#666")
         .style("z-index", "10");
   }

   function resetZoom() {
      svg.transition()
         .duration(750)
         .call(zoom.transform, d3.zoomIdentity); // Reset à la transformation identité
   }

   function createSlider(container) {
      const sliderContainer = container
            .append("div")
            .style("text-align", "center")
            .style("width", config.width + "px");

      // Titre du slider
      sliderContainer.append("div")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .style("color", "#333")

      // Ajouter l'affichage de l'année
      sliderContainer.append("div")
            .attr("id", "year-display")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .style("color", "#3a4a2b;")
            .text(`Year: ${currentYear}`);

      // Conteneur pour le slider
      const sliderControl = sliderContainer.append("div")
            .style("display", "flex")
            .style("align-items", "center")
            .style("justify-content", "center")
         
      // Bouton précédent
      sliderControl.append("button")
            .text("◀")
            .style("padding", "5px 10px")
            .style("font-size", "16px")
            .style("cursor", "pointer")
            .style("border", "0px solid #ccc")
            .style("background", "#fff")
            .style("border-radius", "4px")
            .on("click", function() {
               if (currentYear > config.minYear) {
                  currentYear--;
                  updateSlider();
               }
            });

      // Créer le slider
      sliderControl.append("input")
            .attr("type", "range")
            .attr("id", "year-slider")
            .attr("min", config.minYear)
            .attr("max", config.maxYear)
            .attr("value", currentYear)
            .attr("step", "1")
            .style("width", "400px")
            .style("height", "8px")
            .style("cursor", "pointer")
            .on("input", function() {
               const year = this.value;
               currentYear = parseInt(year);
               updateYearDisplay(currentYear);
               updateDataForYear(currentYear);
               updateMapColors();
            });

      // Bouton suivant
      sliderControl.append("button")
            .text("▶")
            .style("padding", "5px 10px")
            .style("font-size", "16px")
            .style("cursor", "pointer")
            .style("border", "0px solid #ccc")
            .style("background", "#fff")
            .style("border-radius", "4px")
            .on("click", function() {
               if (currentYear < config.maxYear) {
                  currentYear++;
                  updateSlider();
               }
            });    
   }

   function updateSlider() {
      d3.select("#year-slider").node().value = currentYear;
      updateYearDisplay(currentYear);
      updateDataForYear(currentYear);
      updateMapColors();
   }

   function updateYearDisplay(year) {
      d3.select("#year-display").text(`Year: ${year}`);
   }

   function updateDataForYear(year) {
      countryDataMap.clear();
      
      const yearString = year.toString();
      const dataForYear = allData.find(row => row.Year === yearString);
      console.log(`Data for ${year}:`, dataForYear);

      if (dataForYear) {
            Object.keys(dataForYear).forEach(country => {
               if (country !== 'Year' && dataForYear[country] !== '') {
                  const value = parseFloat(dataForYear[country]);
                  if (!isNaN(value)) {
                     countryDataMap.set(country, value);
                  }
               }
            });
      }

      console.log(`Country data map for ${year}:`, countryDataMap.size, "countries");
   }

   function drawMap(world) {
      const geoData = topojson.feature(world, world.objects.countries);
      console.log("Geo data loaded:", geoData.features.length, "countries");

      const countryMappings = {
         'United States of America': 'United States',
         'Russian Federation': 'Russia',
         'Democratic Republic of the Congo': 'Democratic Republic of Congo', 
         'Czech Republic': 'Czechia',
         'Republic of the Congo': 'Congo',
         'Iran (Islamic Republic of)': 'Iran',
         'Viet Nam': 'Vietnam',
         'Syrian Arab Republic': 'Syria',
         'Korea, Republic of': 'South Korea',
         "Korea, Democratic People's Republic of": 'North Korea',
         'Macedonia': 'North Macedonia',
         'Tanzania, United Republic of': 'Tanzania',
         'Bolivia (Plurinational State of)': 'Bolivia',
         'Venezuela (Bolivarian Republic of)': 'Venezuela',
         'Moldova, Republic of': 'Moldova',
         'Brunei Darussalam': 'Brunei',
         'Lao People\'s Democratic Republic': 'Laos',
         'Myanmar': 'Myanmar',
         'Cabo Verde': 'Cape Verde',
         'Côte d\'Ivoire': 'Cote d\'Ivoire',
         'Eswatini': 'Eswatini',
         'Timor-Leste': 'East Timor',
         'Palestine, State of': 'Palestine'
      };

      // Draw countries
      const countries = g.selectAll("path")
         .data(geoData.features)
         .enter()
         .append("path")
         .attr("d", path)
         .attr("fill", d => getCountryColor(d.properties.name, countryMappings))
         .attr("stroke", "#446143ff")
         .attr("stroke-width", 0.5)
         .on("mouseover", function(event, d) {
            // Changer le curseur quand on survole un pays
            d3.select(this).style("cursor", "pointer");
            showTooltip(event, d, countryMappings);
         })
         .on("mouseout", function() {
            d3.select(this).style("cursor", "grab");
            hideTooltip();
         })
         .on("mousemove", function(event) {
            tooltip
               .style("left", (event.pageX + 10) + "px")
               .style("top", (event.pageY - 28) + "px");
         });

      console.log("Countries drawn");
      addLegend(svg, colorScale);
   }

   function getCountryColor(geoName, countryMappings) {
      let value = countryDataMap.get(geoName);
      
      if (value === undefined) {
            const mappedName = countryMappings[geoName];
            if (mappedName) {
               value = countryDataMap.get(mappedName);
            }
      }
      
      if (value === undefined) {
            return '#454545ff';
      }
      
      return colorScale(value);
   }

   function updateMapColors() {
      const countryMappings = {
         'United States of America': 'United States',
         'Russian Federation': 'Russia',
         'Democratic Republic of the Congo': 'Democratic Republic of Congo', 
         'Czech Republic': 'Czechia',
         'Republic of the Congo': 'Congo',
         'Iran (Islamic Republic of)': 'Iran',
         'Viet Nam': 'Vietnam',
         'Syrian Arab Republic': 'Syria',
         'Korea, Republic of': 'South Korea',
         "Korea, Democratic People's Republic of": 'North Korea',
         'Macedonia': 'North Macedonia',
         'Tanzania, United Republic of': 'Tanzania',
         'Bolivia (Plurinational State of)': 'Bolivia',
         'Venezuela (Bolivarian Republic of)': 'Venezuela',
         'Moldova, Republic of': 'Moldova',
         'Brunei Darussalam': 'Brunei',
         'Lao People\'s Democratic Republic': 'Laos',
         'Myanmar': 'Myanmar',
         'Cabo Verde': 'Cape Verde',
         'Côte d\'Ivoire': 'Cote d\'Ivoire',
         'Eswatini': 'Eswatini',
         'Timor-Leste': 'East Timor',
         'Palestine, State of': 'Palestine'
      };

      g.selectAll("path")
         .attr("fill", d => getCountryColor(d.properties.name, countryMappings));
   }

   function showTooltip(event, d, countryMappings) {
      const geoName = d.properties.name;
      let value = countryDataMap.get(geoName);
      let displayName = geoName;
      
      if (value === undefined) {
            const mappedName = countryMappings[geoName];
            if (mappedName) {
               value = countryDataMap.get(mappedName);
               displayName = `${geoName} (${mappedName})`;
            }
      }
      
      tooltip.transition()
            .duration(200)
            .style("opacity", 0.9);
      tooltip.html(`
            <strong>${displayName}</strong><br/>
            Value: ${value !== undefined ? value.toFixed(2) : 'Missing value'}
      `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
   }

   function hideTooltip() {
      tooltip.transition()
            .duration(500)
            .style("opacity", 0);
   }

   function addLegend(svg, colorScale) {
      const legendWidth = 250;
      const legendHeight = 20;
      const margin = { right: 30, bottom: 30 };

      const legend = svg.append("g")
            .attr("transform", `translate(${config.width - legendWidth - margin.right}, ${config.height - legendHeight - margin.bottom})`);

      const defs = svg.append("defs");
      const linearGradient = defs.append("linearGradient")
            .attr("id", "linear-gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");

      colorScale.range().forEach((color, i) => {
            const domain = colorScale.domain();
            const minVal = i === 0 ? domain[0] - 1 : domain[i-1];
            const maxVal = i === colorScale.range().length - 1 ? domain[domain.length - 1] + 1 : domain[i];
            
            linearGradient.append("stop")
               .attr("offset", `${(i * 100) / (colorScale.range().length - 1)}%`)
               .attr("stop-color", color);
      });

      legend.append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#linear-gradient)");

      const legendScale = d3.scaleLinear()
            .domain([colorScale.domain()[0] - 1, colorScale.domain()[colorScale.domain().length - 1] + 1])
            .range([0, legendWidth]);

      const legendAxis = d3.axisBottom(legendScale)
            .tickValues([1, 2, 4, 6, 8, 9])
            .tickSize(6)
            .tickFormat(d => d);

      legend.append("g")
            .attr("transform", `translate(0, ${legendHeight})`)
            .call(legendAxis);

      legend.append("text")
            .attr("y", -10)
            .attr("x", legendWidth / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .text("Fertility rate");
   }

   // Initialize the map
   initializeMap();
});