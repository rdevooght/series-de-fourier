<script>
    import { onMount } from "svelte";
    import * as d3 from "d3";

    export let height = 400;
    export let xDomain = [0, 10];
    export let yDomain = [0, 10];
    export let a = 2;
    export let b = 8;
    export let points = []; // Points that are sync'ed with the parent module

    const margin = { top: 30, right: 20, bottom: 40, left: 40 };

    let width;
    let canvas;
    let svg;
    let xScale, yScale;
    let _points = []; // values that are rendered and updated on drag

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
        setupMarks();
        updateMarks();
    });

    // Reactively render when points change externally
    $: if (points) {
        _points = points;
        if (canvas && width && height) {
            requestAnimationFrame(render);
        }
    }

    function setupSvg() {
        const svgEl = d3.select(svg);
        svgEl.selectAll("*").remove();

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

        // Marks group
        svgEl.append("g").attr("class", "marks");

        // Handles group
        svgEl.append("g").attr("class", "handles");
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
        _points = [];
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
            if (
                (_points && _points.length === 0) ||
                _points[_points.length - 1][0] < domainX
            ) {
                _points.push([domainX, domainY]); // only add new point if it's on the right of the last point
            }
            render();
        }
    }

    function dragEnd() {
        if (_points.length > 1) {
            points = [..._points];
        }
    }

    function render() {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, width, height);

        if (!_points || _points.length < 2) return;

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
        for (const point of _points) {
            // Check if xScale exists (might be rendering before mount fully done)
            if (xScale && yScale) {
                curve.point(xScale(point[0]), yScale(point[1]));
            }
        }
        curve.lineEnd();
        ctx.stroke();
        ctx.restore();
    }

    function setupMarks() {
        if (!svg || !xScale) return;

        const svgEl = d3.select(svg);

        // Create vertical lines once
        svgEl
            .select("g.marks")
            .selectAll("line")
            .data([0, 1]) // Use indices
            .join("line")
            .attr("y1", margin.top)
            .attr("y2", height - margin.bottom)
            .style("stroke", "#ef4444")
            .style("stroke-width", 2)
            .style("stroke-dasharray", "5,5");

        svgEl
            .select("g.handles")
            .selectAll("path")
            .data([0, 1]) // Use indices instead of values
            .join("path")
            .attr("d", d3.symbol().type(d3.symbolTriangle).size(150))
            .style("fill", "#ef4444")
            .style("cursor", "ew-resize")
            .style("pointer-events", "all")
            .each(function (d, i) {
                d3.select(this).call(
                    d3.drag().on("drag", function (event) {
                        const pointerX = event.x;

                        if (!isFinite(pointerX)) return;

                        let value = xScale.invert(pointerX);
                        value = Math.max(
                            xDomain[0],
                            Math.min(xDomain[1], value),
                        );

                        value = Math.round(value * 10) / 10;

                        if (i === 0) {
                            a = Math.min(value, b - 0.5);
                        } else {
                            b = Math.max(value, a + 0.5);
                        }
                    }),
                );
            });
    }

    function updateMarks() {
        if (!svg || !xScale) return;

        const svgEl = d3.select(svg);

        // Just update positions of vertical lines
        svgEl
            .select("g.marks")
            .selectAll("line")
            .attr("x1", (d, i) => xScale(i === 0 ? a : b))
            .attr("x2", (d, i) => xScale(i === 0 ? a : b));

        // Just update handle positions
        svgEl
            .select("g.handles")
            .selectAll("path")
            .attr(
                "transform",
                (d, i) =>
                    `translate(${xScale(i === 0 ? a : b)}, ${height - 10})`,
            );
    }

    $: if (svg && xScale) (updateMarks(), a, b);
</script>

<div
    class="drawing-container"
    bind:clientWidth={width}
    style="height:{height}px;"
>
    <canvas bind:this={canvas} {width} {height}></canvas>
    <svg bind:this={svg} {width} {height}></svg>
</div>

<style>
    .drawing-container {
        width: 100%;
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
    svg {
        pointer-events: none;
    }
</style>
