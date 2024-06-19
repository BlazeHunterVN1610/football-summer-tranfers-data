const margin = { top: 60, right: 30, bottom: 100, left: 100 },
width = 1400 - margin.left - margin.right,
height = 600 - margin.top - margin.bottom;

const svg = d3.select("#boxplot-svg")
.attr("width", width + margin.left + margin.right)
.attr("height", height + margin.top + margin.bottom)
.append("g")
.attr("transform", `translate(${margin.left},${margin.top})`);
    
function drawboxplot(year) {
d3.csv(`https://raw.githubusercontent.com/BlazeHunterVN1610/football-summer-tranfers-data/main/${year}.csv`).then(function(data) {
    svg.selectAll("*").remove();

    data.forEach(function(d) {
        d["Transfer fee"] = +d["Transfer fee"];
    });

    const x = d3.scaleLinear()
        .range([0, width])
        .domain([-50, 120]);

    const y = d3.scaleBand()
        .range([height, 0])
        .padding(0.4);

    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${height})`);

    svg.append("g")
        .attr("class", "y-axis");

    // X-axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom -50)
        .attr("text-anchor", "middle")
        .attr("class", "x-axis-label")
        .style("font-size", "18px")
        .text("Transfer Fee (Million Euros)");
    
    // Chart title
    svg.append("text")
    .attr("x", width / 2)
    .attr("y", margin.top / 2 - 50)
    .attr("class", "chart-title")
    .attr("text-anchor", "middle")
    .text("Transfer Fee to top leagues by player position");

    const allowedCountries = ["England", "Spain", "Germany", "France", "Italy", "Netherlands", "Portugal"];

    const positionGroups = {
        "Centre-Forward": "Forward",
        "Left Winger": "Forward",
        "Right Winger": "Forward",
        "Centre-Back": "Defender",
        "Right-Back": "Defender",
        "Left-Back": "Defender",
        "Left Midfield": "Midfield",
        "Central Midfield": "Midfield",
        "Attacking Midfield": "Midfield",
        "Defensive Midfield": "Midfield",
        "Goalkeeper": "Goalkeeper"
    };

    y.domain(allowedCountries);

    processData("Forward");

    d3.select("#position-slider")
        .on("input", function() {
            const positionIndex = +this.value - 1;
            const position = ["Forward", "Defender", "Midfield", "Goalkeeper"][positionIndex];
            processData(position);
            updateSliderLabel(positionIndex);
        });

    function processData(position) {
        const filteredData = data.filter(d => {
            return positionGroups[d.Position] === position && d["Transfer fee"] >= 0 && d["Transfer fee"] <= 120 && allowedCountries.includes(d.Country_to);
        });

        const summary = d3.group(filteredData, d => d.Country_to);

        const summaryArray = Array.from(summary, ([key, value]) => {
            const fees = value.map(d => d["Transfer fee"]).sort(d3.ascending);
            const q1 = d3.quantile(fees, 0.25);
            const median = d3.median(fees);
            const q3 = d3.quantile(fees, 0.75);
            const iqr = q3 - q1;
            const lowerWhisker = q1 - 1.5 * iqr;
            const upperWhisker = q3 + 1.5 * iqr;
            return {
                country: key,
                fees: fees,
                q1: q1,
                median: median,
                q3: q3,
                lowerWhisker: lowerWhisker,
                upperWhisker: upperWhisker,
                individualFees: value
            };
        });

        svg.select(".x-axis")
            .transition()
            .duration(1000)
            .call(d3.axisBottom(x));

        

        svg.select(".y-axis")
            .transition()
            .duration(1000)
            .call(d3.axisLeft(y));


        svg.selectAll(".box")
            .data(summaryArray, d => d.country)
            .join("rect")
            .attr("class", "box")
            .attr("x", d => x(d.q1))
            .attr("y", d => y(d.country) + y.bandwidth() * 0.25)
            .attr("width", d => x(d.q3) - x(d.q1))
            .attr("height", y.bandwidth() * 0.5)
            .attr("fill", "steelblue")
            .on("mouseover", function(event, d) {
                d3.select("#tooltip")
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px")
                    .transition()
                    .duration(200)
                    .style("opacity", .9);
                d3.select("#tooltip").html(`Q1: ${d.q1}<br>Median: ${d.median}<br>Q3: ${d.q3}<br>Lower Whisker: ${d.lowerWhisker}<br>Upper Whisker: ${d.upperWhisker}`);
            })
            .on("mouseout", function() {
                d3.select("#tooltip")
                    .transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        svg.selectAll(".median")
            .data(summaryArray, d => d.country)
            .join("line")
            .attr("class", "median")
            .attr("x1", d => x(d.median))
            .attr("x2", d => x(d.median))
            .attr("y1", d => y(d.country) + y.bandwidth() * 0.25)
            .attr("y2", d => y(d.country) + y.bandwidth() * 0.75)
            .attr("stroke", "black");

        svg.selectAll(".whisker")
            .data(summaryArray, d => d.country)
            .join("line")
            .attr("class", "whisker")
            .attr("x1", d => x(d.lowerWhisker))
            .attr("x2", d => x(d.upperWhisker))
            .attr("y1", d => y(d.country) + y.bandwidth() * 0.5)
            .attr("y2", d => y(d.country) + y.bandwidth() * 0.5)
            .attr("stroke", "black");

        svg.selectAll(".lowerWhiskerCap")
            .data(summaryArray, d => d.country)
            .join("line")
            .attr("class", "lowerWhiskerCap")
            .attr("x1", d => x(d.lowerWhisker))
            .attr("x2", d => x(d.lowerWhisker))
            .attr("y1", d => y(d.country) + y.bandwidth() * 0.4)
            .attr("y2", d => y(d.country) + y.bandwidth() * 0.6)
            .attr("stroke", "black");

        svg.selectAll(".upperWhiskerCap")
            .data(summaryArray, d => d.country)
            .join("line")
            .attr("class", "upperWhiskerCap")
            .attr("x1", d => x(d.upperWhisker))
            .attr("x2", d => x(d.upperWhisker))
            .attr("y1", d => y(d.country) + y.bandwidth() * 0.4)
            .attr("y2", d => y(d.country) + y.bandwidth() * 0.6)
            .attr("stroke", "black");

        svg.selectAll(".point")
            .data(filteredData, d => d.Country_to + d["Transfer fee"])
            .join("circle")
            .attr("class", "point")
            .attr("cx", d => x(d["Transfer fee"]))
            .attr("cy", d => y(d.Country_to) + y.bandwidth() * 0.9)
            .attr("r", 4)
            .style("fill", "red")
            .on("mouseover", function(event, d) {
                d3.select("#tooltip")
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px")
                    .transition()
                    .duration(200)
                    .style("opacity", .9);
                d3.select("#tooltip").html(`Name: ${d.Name}<br>Position: ${d.Position}<br>Transfer Fee: ${d["Transfer fee"]}`);
            })
            .on("mouseout", function() {
                d3.select("#tooltip")
                    .transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        document.getElementById("position-text").textContent = position;
    }

    // Function to update the slider label and active class on span elements
    function updateSliderLabel(datasetIndex) {
        const positionNames = ["Forward", "Defender", "Midfield", "Goalkeeper"];
        document.getElementById("position-text").textContent = "Position = " + positionNames[datasetIndex];
        document.querySelectorAll('.slider-labels span').forEach((el, i) => {
            if (i === datasetIndex) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });
    }


    // Click event listener for slider labels
    document.querySelectorAll('.slider-labels span').forEach((el, i) => {
        el.addEventListener('click', function() {
            document.getElementById("position-slider").value = i + 1;
            processData(["Forward", "Defender", "Midfield", "Goalkeeper"][i]);
            updateSliderLabel(i);
        });
    });

    // Update the slider label initially
    updateSliderLabel(0);

}).catch(function(error) {
    console.error("Error loading data:", error);
});
}

drawboxplot("2021");

document.getElementById("boxplot-select").addEventListener("change", function() {
const selectedYear = this.value;
drawboxplot(selectedYear);
});