// js/section2.js

// Sample data
const data = [
    { region: 'Africa', value: 120 },
    { region: 'Asia', value: 200 },
    { region: 'Europe', value: 90 },
    { region: 'Americas', value: 160 },
    { region: 'Oceania', value: 40 }
];

(function renderSection2() {
    const container = d3.select('#chart-section2');

    // Clear if rerendered
    container.selectAll('*').remove();

    // Dimensions
    const width = Math.min(720, container.node().clientWidth || 720);
    const height = 360;
    const margin = { top: 30, right: 20, bottom: 60, left: 60 };

    // SVG with viewBox for responsiveness
    const svg = container
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const x = d3.scaleBand()
        .domain(data.map(d => d.region))
        .range([0, innerWidth])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value)]).nice()
        .range([innerHeight, 0]);

    // Axes
    const xAxis = d3.axisBottom(x);
    const yAxis = d3.axisLeft(y).ticks(5);

    g.append('g')
        .attr('class', 'axis x-axis')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis)
        .selectAll('text')
        .attr('dy', '0.75em')
        .attr('transform', 'rotate(0)') // easy to tweak later
        .style('text-anchor', 'middle');

    g.append('g')
        .attr('class', 'axis y-axis')
        .call(yAxis);

    // Bars (style via CSS: .chart .bar)
    g.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')        // styling comes from CSS
        .attr('x', d => x(d.region))
        .attr('y', d => y(d.value))
        .attr('width', x.bandwidth())
        .attr('height', d => innerHeight - y(d.value));

    // Optional title inside SVG (styled via .chart .title)
    g.append('text')
        .attr('class', 'title')
        .attr('x', innerWidth / 2)
        .attr('y', -8)
        .attr('text-anchor', 'middle')
        .text('Events by Region (sample data)');

    // Simple tooltip (CSS-positioned, not inline SVG style)
    const tooltip = d3.select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);

    g.selectAll('.bar')
        .on('mouseenter', (event, d) => {
            tooltip
                .style('opacity', 1)
                .html(`<strong>${d.region}</strong><br/>${d.value} events`);
        })
        .on('mousemove', (event) => {
            const [x, y] = d3.pointer(event);
            tooltip
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseleave', () => {
            tooltip.style('opacity', 0);
        });

    // Rerender on resize (simple debounce)
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(renderSection2, 150);
    }, { once: true }); // prevent infinite loop; reattach inside rerender
})();
