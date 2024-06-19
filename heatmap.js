// Create SVG dimensions
const margin = { top: 50, right: 50, bottom: 150, left: 100 };
const width = 1200 - margin.left - margin.right;
const height = 1000 - margin.top - margin.bottom;

// Create SVG
const svg = d3.select("#heatmap")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

function drawHeatmap(year) {
// Load data
d3.csv(`https://raw.githubusercontent.com/BlazeHunterVN1610/football-summer-tranfers-data/main/${year}.csv`).then(function(data) {
    svg.selectAll("*").remove(); // Clear previous heatmap
    // Preprocess data to calculate counts
    const counts = {};
    data.forEach(function(d) {
        const key = d.Country_from + "_" + d.Country_to;
        counts[key] = (counts[key] || 0) + 1;
    });

    // Extract unique countries
    const countriesFrom = Array.from(new Set(data.map(d => d.Country_from)));
    const countriesTo = Array.from(new Set(data.map(d => d.Country_to)));

    // Create scales
    const xScale = d3.scaleBand()
        .domain(countriesFrom)
        .range([0, width])
        .padding(0.05);

    const yScale = d3.scaleBand()
        .domain(countriesTo)
        .range([0, height])
        .padding(0.05);

    const maxCount = d3.max(Object.values(counts));
    let colorScale;

    if (year === "2021") {
        colorScale = d3.scaleQuantize()
            .domain([0, maxCount])
            .range([
                "rgb(255,245,245)", "rgb(247, 230, 230)", "rgb(255,225,225)",
                "rgb(255,215,215)", "rgb(255,205,205)", "rgb(255,195,195)",
                "rgb(255,185,185)", "rgb(255,175,175)", "rgb(255,165,165)",
                "rgb(255,155,155)", "rgb(255,145,145)", "rgb(255,135,135)",
                "rgb(255,125,125)", "rgb(255,115,115)", "rgb(255,105,105)",
                "rgb(255,95,95)", "rgb(255,85,85)", "rgb(255,75,75)",
                "rgb(255,65,65)", "rgb(255,55,55)", "rgb(255,45,45)",
                "rgb(255,35,35)", "rgb(255,25,25)", "rgb(245,25,25)",
                "rgb(235,25,25)", "rgb(225,25,25)", "rgb(215,25,25)"
            ]);
    } else if (year === "2022") {
        colorScale = d3.scaleQuantize()
            .domain([0, maxCount])
            .range([
                "rgb(255,245,245)", "rgb(230, 247, 230)", "rgb(225, 255, 225)",
                "rgb(215, 255, 215)", "rgb(205, 255, 205)", "rgb(195, 255, 195)",
                "rgb(185, 255, 185)", "rgb(175, 255, 175)", "rgb(165, 255, 165)",
                "rgb(155, 255, 155)", "rgb(145, 255, 145)", "rgb(135, 255, 135)",
                "rgb(125, 255, 125)", "rgb(115, 255, 115)", "rgb(105, 255, 105)",
                "rgb(95, 255, 95)", "rgb(85, 255, 85)", "rgb(75, 255, 75)",
                "rgb(65, 255, 65)", "rgb(55, 255, 55)", "rgb(45, 255, 45)",
                "rgb(35, 255, 35)", "rgb(25, 255, 25)", "rgb(25, 245, 25)",
                "rgb(25, 235, 25)", "rgb(25, 225, 25)", "rgb(25, 215, 25)",
                "rgb(25, 205, 25)"
            ]);
    }

    // Generate all possible combinations of Country_from and Country_to
    const allCombinations = [];
    countriesFrom.forEach(from => {
        countriesTo.forEach(to => {
            allCombinations.push({ Country_from: from, Country_to: to });
        });
    });

    // Add cells
    svg.selectAll(".cell")
        .data(allCombinations)
        .enter().append("rect")
        .attr("class", "cell")
        .attr("x", d => xScale(d.Country_from))
        .attr("y", d => yScale(d.Country_to))
        .attr("width", xScale.bandwidth())
        .attr("height", yScale.bandwidth())
        .style("fill", d => {
            const key = d.Country_from + "_" + d.Country_to;
            return colorScale(counts[key] || 0);
        })
        .style("stroke", "#000")
        .style("stroke-width", "1px")
        .on("mouseover", function(event, d) {
            const tooltip = d3.select("#tooltip");
            const key = d.Country_from + "_" + d.Country_to;
            tooltip.style("display", "block")
                   .style("left", (event.pageX + 10) + "px")
                   .style("top", (event.pageY - 20) + "px")
                   .html(`Country From: ${d.Country_from}<br>Country To: ${d.Country_to}<br>Number of Transfers: ${counts[key] || 0}`);
        })
        .on("mouseout", function() {
            d3.select("#tooltip").style("display", "none");
        });

    // Add axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("class", "axis-text")
        .style("text-anchor", "end")
        .attr("dx", "-0.8em")
        .attr("dy", "-0.15em")
        .attr("transform", "rotate(-65)");

    svg.append("g")
        .call(d3.axisLeft(yScale))
        .selectAll("text")
        .attr("class", "axis-text");

    // Add labels
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 70)
        .style("text-anchor", "middle")
        .style("font-size", "21px")
        .text("Country From");

    svg.append("text")
        .attr("x", -height / 2)
        .attr("y", -margin.left / 2 - 36)
        .attr("transform", "rotate(-90)")
        .style("text-anchor", "middle")
        .style("font-size", "20px")
        .text("Country To");

    // Chart title
    svg.append("text")
    .attr("x", width / 2)
    .attr("y", margin.top / 2 - 50)
    .attr("class", "chart-title")
    .attr("text-anchor", "middle")
    .text("Football Transfers by Country");

    // Add legend
    const legendWidth = 300;
    const legendHeight = 20;
    const legendPadding = 10;
    const legendSteps = 17; // Number of steps in the color scale

    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width / 2 - legendWidth / 2},${height + margin.bottom / 2})`);

    // Define a gradient
    const defs = svg.append("defs");

    const gradient = defs.append("linearGradient")
        .attr("id", "gradient")
        .attr("x1", "0%")
        .attr("x2", "100%")
        .attr("y1", "0%")
        .attr("y2", "0%");

    const colorRange = colorScale.range();
    colorRange.forEach((color, i) => {
        gradient.append("stop")
            .attr("offset", `${(i / (colorRange.length - 1)) * 100}%`)
            .attr("style", `stop-color:${color};stop-opacity:1`);
    });

    // Draw the gradient rectangle
    legend.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#gradient)");

    // Add labels
    const legendScale = d3.scaleLinear()
        .domain([0, maxCount])
        .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale)
        .ticks(legendSteps)
        .tickSize(10)
        .tickPadding(5);

    legend.append("g")
        .attr("class", "legend-axis")
        .attr("transform", `translate(0,${legendHeight})`)
        .call(legendAxis);

    // Add legend label
    legend.append("text")
        .attr("x", legendWidth / 2)
        .attr("y", legendHeight + legendPadding + 35)
        .style("text-anchor", "middle")
        .style("font-size", "17px")
        .text("Number of Transfers");
}).catch(function(error) {
    console.log(error);
});
}
    // Initial draw
    drawHeatmap("2021");

    // Change heatmap on select change
    document.getElementById("heatmap-select").addEventListener("change", function() {
        const selectedYear = this.value;
        drawHeatmap(selectedYear);
    });
    