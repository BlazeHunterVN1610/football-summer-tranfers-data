const datasets = {
    "2021": "https://raw.githubusercontent.com/BlazeHunterVN1610/football-summer-tranfers-data/main/2021.csv",
    "2022": "https://raw.githubusercontent.com/BlazeHunterVN1610/football-summer-tranfers-data/main/2022.csv"
};

// Function to draw the charts
function drawCharts(datasetUrl) {
    // Remove any existing SVG elements to clear previous charts
    d3.select("#chartFrom").selectAll("*").remove();
    d3.select("#chartTo").selectAll("*").remove();
    
    // Fetch and draw new charts based on the dataset URL
    d3.csv(datasetUrl).then(function(data) {
        drawCountryToChart(data);
        drawCountryFromChart(data);
    });
}

// Function to draw the country_to chart
function drawCountryToChart(data) {
    // Processing the CSV data
    const requiredCountries = ['England', 'Spain', 'Germany', 'France', 'Italy', 'Netherlands', 'Portugal'];
    const transferData = data.map(d => ({
        country: d['Country_from'],
        fee: +d['Transfer fee']
    })).filter(d => requiredCountries.includes(d.country));

    // Summarizing the data by country
    const feeSummary = transferData.reduce((acc, item) => {
        if (acc[item.country]) {
            acc[item.country] += item.fee;
        } else {
            acc[item.country] = item.fee;
        }
        return acc;
    }, {});

    const summaryData = Object.entries(feeSummary).map(([key, value]) => ({ country: key, fee: value }));

    // Calculate total income
    const totalIncome = summaryData.reduce((sum, d) => sum + d.fee, 0);
    const totalIncomeInBillions = totalIncome / 1000;

    // Preparing the pie chart dimensions and colors
    const width = 650; /* Reduced width */
    const height = 650; /* Reduced height */
    const margin = 20;  /* Reduced margin */
    const radius = Math.min(width, height) / 2 - margin;
    const innerRadius = radius * 0.5; // Inner radius for the hollow effect
    const expandedRadius = radius * 1.1; // Expanded radius for hover effect
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Creating SVG element
    const svg = d3.select("#chartTo")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Creating a tooltip
    const tooltip = d3.select("#tooltip");

    // Generating the pie chart data
    const pie = d3.pie()
        .value(d => d.fee);
    const data_ready = pie(summaryData);

    // Building the arcs
    const arc = d3.arc()
        .innerRadius(innerRadius) // Set the inner radius to create a hollow center
        .outerRadius(radius);

    const arcExpanded = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(expandedRadius);

    // Creating the slices
    const slices = svg.selectAll('slices')
        .data(data_ready)
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', d => color(d.data.country))
        .attr("stroke", "black")
        .style("stroke-width", "2px")
        .style("opacity", 0.7)
        .on("mouseover", function(event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('d', arcExpanded);

            tooltip.transition()
                .duration(200)
                .style("opacity", 0.9);
            tooltip.html(`${d.data.country}: ${d.data.fee.toFixed(2)}M`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('d', arc);

            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    // Adding the labels on slices conditionally
    svg.selectAll('slices')
        .data(data_ready)
        .enter()
        .append('text')
        .attr("transform", d => {
            const [x, y] = arc.centroid(d);
            const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
            return `translate(${x}, ${y}) rotate(${(midAngle * 180 / Math.PI) - 90})`;
        })
        .style("text-anchor", "middle")
        .style("font-size", 12)
        .each(function(d) {
            const [x, y] = arc.centroid(d);
            const angle = d.endAngle - d.startAngle;
            const threshold = 0.2; // Angle threshold for showing the label
            if (angle > threshold) {
                const percentage = ((d.data.fee / totalIncome) * 100).toFixed(2);
                const countryName = d.data.country;
                d3.select(this)
                    .append("tspan")
                    .attr("x", 0)
                    .attr("dy", "-0.5em") // Position the first line slightly above the center point
                    .text(countryName);
                d3.select(this)
                    .append("tspan")
                    .attr("x", 0)
                    .attr("dy", "1.2em") // Position the second line slightly below the first line
                    .text(`${percentage}%`);
            }
        });

    // Adding the central label
    const centerLabel = svg.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", ".35em")
        .style("font-size", "16px")
        .style("font-weight", "bold");

    // Default center label text
    centerLabel
        .append("tspan")
        .attr("x", 0)
        .attr("dy", "-0.5em")
        .text("Income");
    centerLabel
        .append("tspan")
        .attr("x", 0)
        .attr("dy", "1.2em")
        .text(`${totalIncomeInBillions.toFixed(2)} bn EUR`);
}

// Function to draw the country_from chart
function drawCountryFromChart(data) {
    // Processing the CSV data
    const requiredCountries = ['England', 'Spain', 'Germany', 'France', 'Italy', 'Netherlands', 'Portugal'];
    const transferData = data.map(d => ({
        country: d['Country_to'],
        fee: +d['Transfer fee']
    })).filter(d => requiredCountries.includes(d.country));

    // Summarizing the data by country
    const feeSummary = transferData.reduce((acc, item) => {
        if (acc[item.country]) {
            acc[item.country] += item.fee;
        } else {
            acc[item.country] = item.fee;
        }
        return acc;
    }, {});

    const summaryData = Object.entries(feeSummary).map(([key, value]) => ({ country: key, fee: value }));

    // Calculate total spend
    const totalSpend = summaryData.reduce((sum, d) => sum + d.fee, 0);
    const totalSpendInBillions = totalSpend / 1000;

    // Preparing the pie chart dimensions and colors
    const width = 650; /* Reduced width */
    const height = 650; /* Reduced height */
    const margin = 20;  /* Reduced margin */
    const radius = Math.min(width, height) / 2 - margin;
    const innerRadius = radius * 0.5; // Inner radius for the hollow effect
    const expandedRadius = radius * 1.1; // Expanded radius for hover effect
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Creating SVG element
    const svg = d3.select("#chartFrom")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    // Creating a tooltip
    const tooltip = d3.select("#tooltip");

    // Generating the pie chart data
    const pie = d3.pie()
        .value(d => d.fee);
    const data_ready = pie(summaryData);

    // Building the arcs
    const arc = d3.arc()
        .innerRadius(innerRadius) // Set the inner radius to create a hollow center
        .outerRadius(radius);

    const arcExpanded = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(expandedRadius);

    // Creating the slices
    const slices = svg.selectAll('slices')
        .data(data_ready)
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', d => color(d.data.country))
        .attr("stroke", "black")
        .style("stroke-width", "2px")
        .style("opacity", 0.7)
        .on("mouseover", function(event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('d', arcExpanded);

            tooltip.transition()
                .duration(200)
                .style("opacity", 0.9);
            tooltip.html(`${d.data.country}: ${d.data.fee.toFixed(2)}M`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('d', arc);

            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    // Adding the labels on slices conditionally
    svg.selectAll('slices')
        .data(data_ready)
        .enter()
        .append('text')
        .attr("transform", d => {
            const [x, y] = arc.centroid(d);
            const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
            return `translate(${x}, ${y}) rotate(${(midAngle * 180 / Math.PI) - 90})`;
        })
        .style("text-anchor", "middle")
        .style("font-size", 12)
        .each(function(d) {
            const [x, y] = arc.centroid(d);
            const angle = d.endAngle - d.startAngle;
            const threshold = 0.2; // Angle threshold for showing the label
            if (angle > threshold) {
                const percentage = ((d.data.fee / totalSpend) * 100).toFixed(2);
                const countryName = d.data.country;
                d3.select(this)
                    .append("tspan")
                    .attr("x", 0)
                    .attr("dy", "-0.5em") // Position the first line slightly above the center point
                    .text(countryName);
                d3.select(this)
                    .append("tspan")
                    .attr("x", 0)
                    .attr("dy", "1.2em") // Position the second line slightly below the first line
                    .text(`${percentage}%`);
            }
        });

    // Adding the central label
    const centerLabel = svg.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", ".35em")
        .style("font-size", "16px")
        .style("font-weight", "bold");

    // Default center label text
    centerLabel
        .append("tspan")
        .attr("x", 0)
        .attr("dy", "-0.5em")
        .text("Spend");
    centerLabel
        .append("tspan")
        .attr("x", 0)
        .attr("dy", "1.2em")
        .text(`${totalSpendInBillions.toFixed(2)} bn EUR`);
}

// Initial draw with default dataset (2021)
drawCharts(datasets["2021"]);

// Event listener for dataset change
document.getElementById("dataset-selector").addEventListener("change", function() {
    const selectedDataset = this.value;
    drawCharts(datasets[selectedDataset]);
});