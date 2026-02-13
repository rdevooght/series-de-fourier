<script>
    import { onMount } from "svelte";
    import * as d3 from "d3";

    export let data = []; // Array of numbers
    export let labels = []; // Array of strings/numbers
    export let height = 150;
    export let color = "#3b82f6"; // Default blue
    export let yDomain = null; // Optional fixed domain [min, max]
    export let barWidthRatio = 0.8; // default ratio

    let svg;
    let width;
    const margin = { top: 20, right: 30, bottom: 25, left: 40 };

    function draw() {
        if (!svg || !data) return;

        const svgEl = d3.select(svg);
        svgEl.selectAll("*").remove();

        // Ensure width is valid before drawing
        if (!width) return;

        const w = width;
        const h = height;

        // X Scale
        const xScale = d3
            .scaleBand()
            .domain(d3.range(data.length))
            .range([margin.left, w - margin.right])
            .padding(1 - barWidthRatio);

        // Y Scale
        const yMin = yDomain ? yDomain[0] : Math.min(0, d3.min(data));
        const yMax = yDomain ? yDomain[1] : Math.max(0, d3.max(data));

        // Add some padding to Y domain
        const yPadding = yDomain ? 0 : (yMax - yMin) * 0.1;

        const yScale = d3
            .scaleLinear()
            .domain([yMin - yPadding, yMax + yPadding])
            .range([h - margin.bottom, margin.top]);

        // X Axis
        const xAxis = d3
            .axisBottom(xScale)
            .tickFormat((i) => (labels[i] !== undefined ? labels[i] : i + 1))
            .tickSizeOuter(0);

        if (data.length > 20) {
            xAxis.tickValues(xScale.domain().filter((d, i) => !(i % 5)));
        }

        const xAxisG = svgEl
            .append("g")
            .attr("transform", `translate(0,${h - margin.bottom})`)
            .call(xAxis);

        xAxisG.select(".domain").style("opacity", 0);

        // Y Axis
        const yAxis = d3.axisLeft(yScale).ticks(5).tickSizeOuter(0);

        svgEl
            .append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(yAxis)
            .call((g) => g.select(".domain").remove())
            .call((g) => g.selectAll(".tick line").remove());

        // Zero line
        svgEl
            .append("line")
            .attr("x1", margin.left)
            .attr("x2", w - margin.right)
            .attr("y1", yScale(0))
            .attr("y2", yScale(0))
            .attr("stroke", "black")
            .attr("stroke-width", 1);

        // Bars
        const bandwidth = xScale.bandwidth();
        const barWidth = Math.min(bandwidth, 5); // Max 5px width
        const offset = (bandwidth - barWidth) / 2;
        const radius = barWidth / 2; // Fully rounded cap

        svgEl
            .selectAll(".bar")
            .data(data)
            .join("path")
            .attr("class", "bar")
            .attr("fill", (d, i) => (Array.isArray(color) ? color[i] : color))
            .attr("d", (d, i) => {
                const x = xScale(i) + offset;
                const yZero = yScale(0);
                const yVal = yScale(d);
                const h = Math.abs(yVal - yZero);

                // If height is very small, minimal rendering
                if (h < 0.5) return "";

                // Construct path for partial rounding
                // Round only the extremity away from axis
                if (d > 0) {
                    // Upward bar: round top
                    // Start bottom-left -> top-left -> top-right -> bottom-right -> close
                    return `
                        M ${x},${yZero}
                        L ${x},${yVal + radius}
                        Q ${x},${yVal} ${x + radius},${yVal}
                        Q ${x + barWidth},${yVal} ${x + barWidth},${yVal + radius}
                        L ${x + barWidth},${yZero}
                        Z
                    `;
                } else {
                    // Downward bar: round bottom
                    // Start top-left -> top-right -> bottom-right -> bottom-left -> close
                    return `
                        M ${x},${yZero}
                        L ${x + barWidth},${yZero}
                        L ${x + barWidth},${yVal - radius}
                        Q ${x + barWidth},${yVal} ${x + radius},${yVal}
                        Q ${x},${yVal} ${x},${yVal - radius}
                        Z
                    `;
                }
            });

        // Hover effect
        svgEl
            .selectAll(".bar")
            .append("title")
            .text((d, i) => `${labels[i] || i + 1}: ${d.toFixed(4)}`);

        // "k ->" label
        svgEl
            .append("text")
            .attr("x", w - margin.right + 5)
            .attr("y", h - margin.bottom + 4)
            .attr("text-anchor", "start")
            .attr("font-size", "10px")
            .attr("fill", "#64748b")
            .style("font-style", "italic")
            .text("k →");
    }

    onMount(draw);
    $: if (svg && width && data) (draw(), data, labels, yDomain, color);
</script>

<div class="plot-container" bind:clientWidth={width}>
    <svg bind:this={svg} {width} {height}></svg>
</div>

<style>
    .plot-container {
        width: 100%;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        overflow: hidden;
        background: white;
    }
</style>
