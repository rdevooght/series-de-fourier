<script>
    import { onMount } from "svelte";
    import * as d3 from "d3";

    let width;
    export let height = 250;
    export let xDomain = [0, 10];
    export let yDomain = [-2, 8];
    export let lines = []; // Array of { points, color, label? }
    export let title = "";
    export let vertical_lines = []; // Array of x coordinates. A vertical line is plotted at each point

    console.log(lines);

    const margin = { top: 30, right: 30, bottom: 40, left: 50 };
    let svg;

    function draw() {
        if (!svg) return;

        const svgEl = d3.select(svg);
        svgEl.selectAll("*").remove();

        // Use plotWidth instead of width
        const w = width;

        const xScale = d3
            .scaleLinear()
            .domain(xDomain)
            .range([margin.left, w - margin.right]);

        const yScale = d3
            .scaleLinear()
            .domain(yDomain)
            .range([height - margin.bottom, margin.top]);

        // Title
        if (title) {
            svgEl
                .append("text")
                .attr("x", w / 2)
                .attr("y", 16)
                .attr("text-anchor", "middle")
                .attr("font-size", "14px")
                .attr("font-weight", "bold")
                .attr("fill", "#374151")
                .text(title);
        }

        // X axis
        svgEl
            .append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(xScale))
            .call((g) => g.select(".domain").style("opacity", 0));

        // Y axis
        svgEl
            .append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(yScale))
            .call((g) => g.select(".domain").style("opacity", 0));

        // Grid
        svgEl
            .append("g")
            .style("stroke-dasharray", "2,2")
            .style("opacity", 0.15)
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(
                d3
                    .axisBottom(xScale)
                    .tickSize(-height + margin.top + margin.bottom)
                    .tickFormat(""),
            );

        svgEl
            .append("g")
            .style("stroke-dasharray", "2,2")
            .style("opacity", 0.15)
            .attr("transform", `translate(${margin.left},0)`)
            .call(
                d3
                    .axisLeft(yScale)
                    .tickSize(-w + margin.left + margin.right)
                    .tickFormat(""),
            );

        // Reference lines at x=0 and y=0
        svgEl
            .append("line")
            .attr("x1", xScale(xDomain[0]))
            .attr("x2", xScale(xDomain[1]))
            .attr("y1", yScale(0) + 0.5)
            .attr("y2", yScale(0) + 0.5)
            .attr("stroke", "black")
            .attr("stroke-width", 1);

        svgEl
            .append("line")
            .attr("x1", xScale(0) + 0.5)
            .attr("x2", xScale(0) + 0.5)
            .attr("y1", yScale(yDomain[0]))
            .attr("y2", yScale(yDomain[1]))
            .attr("stroke", "black")
            .attr("stroke-width", 1);

        // Lines
        const line = d3
            .line()
            .x((d) => xScale(d[0]))
            .y((d) => yScale(d[1]))
            .curve(d3.curveLinear);

        for (const l of lines) {
            if (!l.points || l.points.length < 2) continue;
            svgEl
                .append("path")
                .datum(l.points.filter((p) => p[1] !== null))
                .attr("fill", "none")
                .attr("stroke", l.color || "#2563eb")
                .attr("stroke-width", l.width || 2)
                .attr("stroke-dasharray", l.dashed ? "2,2" : null)
                .attr("d", line);
        }

        // Vertical lines
        svgEl
            .append("g")
            .attr("class", "vertical-lines")
            .selectAll("line")
            .data(vertical_lines)
            .join("line")
            .attr("x1", (d) => xScale(d) + 0.5)
            .attr("x2", (d) => xScale(d) + 0.5)
            .attr("y1", yScale(yDomain[0]))
            .attr("y2", yScale(yDomain[1]))
            .style("stroke", "#ef4444")
            .style("stroke-width", 2)
            .style("stroke-dasharray", "5,5");
    }

    onMount(draw);
    $: if (svg) (draw(), lines, xDomain, yDomain, width);
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
