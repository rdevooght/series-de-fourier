<script>
    import { onMount, createEventDispatcher } from "svelte";
    import * as d3 from "d3";

    export let width = 600;
    export let height = 400;
    export let xDomain = [0, 10];
    export let yDomain = [0, 10];
    export let domainMarks = [];

    const dispatch = createEventDispatcher();
    const margin = { top: 30, right: 30, bottom: 40, left: 50 };

    let container;
    let canvas;
    let svg;
    let points = [];
    let xScale, yScale;

    onMount(() => {
        xScale = d3
            .scaleLinear()
            .domain(xDomain)
            .range([margin.left, width - margin.right]);

        yScale = d3
            .scaleLinear()
            .domain(yDomain)
            .range([height - margin.bottom, margin.top]);

        setupSvg();
        setupCanvas();
        updateMarks();
    });

    function setupSvg() {
        const svgEl = d3.select(svg);
        svgEl.selectAll("*").remove();

        // X axis
        svgEl
            .append("g")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(xScale));

        // Y axis
        svgEl
            .append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(yScale));

        // Grid
        svgEl
            .append("g")
            .attr("class", "grid")
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .style("stroke-dasharray", "2,2")
            .style("opacity", 0.2)
            .call(
                d3
                    .axisBottom(xScale)
                    .tickSize(-height + margin.top + margin.bottom)
                    .tickFormat(""),
            );

        svgEl
            .append("g")
            .attr("class", "grid")
            .attr("transform", `translate(${margin.left},0)`)
            .style("stroke-dasharray", "2,2")
            .style("opacity", 0.2)
            .call(
                d3
                    .axisLeft(yScale)
                    .tickSize(-width + margin.left + margin.right)
                    .tickFormat(""),
            );

        // Marks group
        svgEl.append("g").attr("class", "marks");
    }

    function setupCanvas() {
        const ctx = canvas.getContext("2d");
        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        d3.select(canvas).call(
            d3
                .drag()
                .container(canvas)
                .on("start", dragStart)
                .on("drag", dragged)
                .on("end", dragEnd),
        );
    }

    function dragStart() {
        points = [];
    }

    function dragged(event) {
        const { x, y } = event;
        if (
            x >= margin.left &&
            x <= width - margin.right &&
            y >= margin.top &&
            y <= height - margin.bottom
        ) {
            const domainX = xScale.invert(x);
            const domainY = yScale.invert(y);
            points.push([domainX, domainY]);
            render();
        }
    }

    function dragEnd() {
        if (points.length > 1) {
            dispatch("draw", { points: [...points] });
        }
    }

    function render() {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, width, height);

        if (points.length < 2) return;

        ctx.save();
        ctx.beginPath();
        ctx.rect(
            margin.left,
            margin.top,
            width - margin.left - margin.right,
            height - margin.top - margin.bottom,
        );
        ctx.clip();

        ctx.strokeStyle = "#2563eb";
        ctx.lineWidth = 2;
        ctx.beginPath();

        const curve = d3.curveBasis(ctx);
        curve.lineStart();
        for (const point of points) {
            curve.point(xScale(point[0]), yScale(point[1]));
        }
        curve.lineEnd();
        ctx.stroke();
        ctx.restore();
    }

    function updateMarks() {
        if (!svg || !xScale) return;
        d3.select(svg)
            .select("g.marks")
            .selectAll("line")
            .data(domainMarks)
            .join("line")
            .attr("x1", (x) => xScale(x))
            .attr("y1", margin.top)
            .attr("x2", (x) => xScale(x))
            .attr("y2", height - margin.bottom)
            .style("stroke", "#ef4444")
            .style("stroke-width", 2)
            .style("stroke-dasharray", "5,5");
    }

    $: if (svg && xScale) (updateMarks(), domainMarks);

    export function clear() {
        points = [];
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, width, height);
    }
</script>

<div
    class="drawing-container"
    bind:this={container}
    style="width:{width}px;height:{height}px;"
>
    <svg bind:this={svg} {width} {height}></svg>
    <canvas bind:this={canvas} {width} {height}></canvas>
</div>

<style>
    .drawing-container {
        position: relative;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        overflow: hidden;
        background: white;
    }
    svg,
    canvas {
        position: absolute;
        top: 0;
        left: 0;
    }
    canvas {
        cursor: crosshair;
    }
</style>
