const csvUrl = 'https://raw.githubusercontent.com/BlazeHunterVN1610/football-summer-tranfers-data/main/2021.csv';
const selectedCountries = ['England', 'Spain', 'Germany', 'France', 'Italy', 'Netherlands', 'Portugal'];

// Set dimensions and margins for the chart
const margin = { top: 50, right: 150, bottom: 100, left: 150 };
const width = 1400 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

// Append SVG element to the chart container
const svg = d3.select("#barChart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom + 50)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Define the y-scale domain only once to ensure the same y-axis for all charts
const y = d3.scaleBand()
    .domain(selectedCountries)
    .range([0, height])
    .padding(0.1);

// Create a group for the y-axis only once
const yAxisGroup = svg.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(y));

// Add a static title to the chart
svg.append("text")
    .attr("x", width / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .style("font-size", "24px")
    .attr("class", "title")
    .text("Transfer Balance Between Countries");

// Create a group for the x-axis to be able to move it
const xAxisGroup = svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`);

// Load and process data
d3.csv(csvUrl).then(data => {
    // Convert the Transfer fee to numeric
    data.forEach(d => {
        d['Transfer fee'] = +d['Transfer fee'];
    });

    function aggregateData(data, column) {
        const filteredData = data.filter(d => selectedCountries.includes(d[column]));
        const aggregatedData = d3.rollup(filteredData,
            v => d3.sum(v, d => d['Transfer fee']),
            d => d[column]
        );
        return Array.from(aggregatedData, ([country, fee]) => ({ country, fee }));
    }

    // Define the datasets with the same countries for both 'country_to' and 'country_from'
    const countryToData = aggregateData(data, 'Country_to');
    const countryFromData = aggregateData(data, 'Country_from');

    // Calculate the difference between 'country_from' and 'country_to' for each country
    const transferBalanceData = countryFromData.map((fromCountry) => {
        const toCountry = countryToData.find(c => c.country === fromCountry.country);
        return {
            country: fromCountry.country,
            fee: fromCountry.fee - (toCountry ? toCountry.fee : 0)
        };
    });

    // Combine all datasets into an array for easy access
    const datasets = [countryToData, countryFromData, transferBalanceData];

    // Define a color scale for the bars
    const color = d3.scaleOrdinal()
        .domain(selectedCountries)
        .range(d3.schemeCategory10.slice(0, selectedCountries.length));

    // Initialize the legend once
    const legendGroup = svg.append("g")
        .attr("class", "legend-group")
        .attr("transform", `translate(${width + 20}, 0)`);

    const legend = legendGroup.selectAll(".legend")
        .data(selectedCountries)
        .enter()
        .append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(0,${i * 30})`);

    legend.append("rect")
        .attr("width", 20)
        .attr("height", 20)
        .style("fill", d => color(d))
        .style("stroke", "black");

    legend.append("text")
        .attr("x", 30)
        .attr("y", 10)
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .style("font-size", "14px")
        .text(d => d);

    // Function to draw the chart with the given data
    function drawChart(data) {
        // Determine the minimum and maximum fees to create a balanced x-axis
        const minFee = d3.min(data, d => d.fee);
        const maxFee = d3.max(data, d => d.fee);
        const maxAbsFee = Math.max(Math.abs(minFee), Math.abs(maxFee));

        // Set the x-scale for the chart
        const x = d3.scaleLinear()
            .domain([-maxAbsFee * 1.1, maxAbsFee * 1.1])
            .range([0, width]);

        // Add the X axis
        xAxisGroup.call(d3.axisBottom(x).ticks(10).tickFormat(d => `${d}`))
            .selectAll("text")
            .style("font-size", "12px");

        // Remove any existing bars and labels before drawing new ones
        svg.selectAll(".bar").remove();
        svg.selectAll(".bar-label").remove();
        svg.selectAll(".x-axis-label").remove();

        // Add the bars
        svg.selectAll(".bar")
            .data(data)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("y", d => y(d.country))
            .attr("height", y.bandwidth())
            .attr("x", d => x(Math.min(0, d.fee)))
            .attr("width", d => Math.abs(x(d.fee) - x(0)))
            .attr("fill", d => color(d.country))
            .attr("stroke", "black")
            .attr("stroke-width", "2px");

        // Add the values as labels on the bars, formatted to 2 decimal places
        svg.selectAll(".bar-label")
            .data(data)
            .enter()
            .append("text")
            .attr("class", "bar-label")
            .attr("y", d => y(d.country) + y.bandwidth() / 2)
            .attr("dy", ".35em")
            .attr("x", d => {
                const barWidth = Math.abs(x(d.fee) - x(0));
                return x(d.fee) < x(0) ? x(d.fee) - 5 : x(0) + barWidth + 5;
            })
            .attr("text-anchor", d => {
                const barWidth = Math.abs(x(d.fee) - x(0));
                return barWidth < 40 ? (x(d.fee) < x(0) ? "end" : "start") : "middle";
            })
            .style("fill", d => {
                const barWidth = Math.abs(x(d.fee) - x(0));
                return barWidth < 40 ? "black" : "white";
            })
            .style("font-size", "14px")
            .text(d => `${d.fee.toFixed(2)}M`);

        // Add X-axis label
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 10)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .attr("class", "x-axis-label")
            .text("Fee, mln EUR");

        // Add pan and zoom functionality
        svg.call(d3.zoom()
            .scaleExtent([1, 5])
            .translateExtent([[-width, -Infinity], [2 * width, Infinity]])
            .on("zoom", (event) => {
                const transform = event.transform;
                const new_xScale = transform.rescaleX(x);
                xAxisGroup.call(d3.axisBottom(new_xScale).ticks(10).tickFormat(d => `${d}`));

                // Adjust the bars based on the new scale
                svg.selectAll(".bar")
                    .attr("x", d => new_xScale(Math.min(0, d.fee)))
                    .attr("width", d => Math.abs(new_xScale(d.fee) - new_xScale(0)));

                // Adjust the labels based on the new scale
                svg.selectAll(".bar-label")
                    .attr("x", d => {
                        const barWidth = Math.abs(new_xScale(d.fee) - new_xScale(0));
                        return new_xScale(d.fee) < new_xScale(0) ? new_xScale(d.fee) - 5 : new_xScale(0) + barWidth + 5;
                    })
                    .attr("text-anchor", d => {
                        const barWidth = Math.abs(new_xScale(d.fee) - new_xScale(0));
                        return barWidth < 40 ? (new_xScale(d.fee) < new_xScale(0) ? "end" : "start") : "middle";
                    })
                    .style("fill", d => {
                        const barWidth = Math.abs(new_xScale(d.fee) - new_xScale(0));
                        return barWidth < 40 ? "black" : "white";
                    });
            }));
    }

    // Initial chart drawing
    drawChart(datasets[0]);

    // Slider to switch between charts
    document.getElementById("chartSlider").addEventListener("input", function() {
        const index = +this.value - 1;
        const sliderValues = ["Spend", "Income", "Net Spend"];
        drawChart(datasets[index]);
        document.getElementById("sliderLabel").textContent = `Balance = ${sliderValues[index]}`;

        // Highlight the selected label
        document.querySelectorAll(".slider-labels span").forEach((el, idx) => {
            if (idx === index) {
                el.classList.add("active");
            } else {
                el.classList.remove("active");
            }
        });
    });

    // Initial highlight for the slider labels
    document.getElementById("labelSpend").classList.add("active");

    // Add event listeners to slider labels for quick selection
    document.getElementById("labelSpend").addEventListener("click", () => {
        document.getElementById("chartSlider").value = 1;
        document.getElementById("chartSlider").dispatchEvent(new Event('input'));
    });
    document.getElementById("labelIncome").addEventListener("click", () => {
        document.getElementById("chartSlider").value = 2;
        document.getElementById("chartSlider").dispatchEvent(new Event('input'));
    });
    document.getElementById("labelNetSpend").addEventListener("click", () => {
        document.getElementById("chartSlider").value = 3;
        document.getElementById("chartSlider").dispatchEvent(new Event('input'));
    });
});