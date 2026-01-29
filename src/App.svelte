<script>
    import DrawingCanvas from "./lib/DrawingCanvas.svelte";
    import FunctionPlot from "./lib/FunctionPlot.svelte";
    import {
        computeFourierCoefs,
        fourierApprox,
        sampleFunction,
    } from "./lib/fourier.js";

    // Domain parameters
    let a = 2;
    let b = 8;

    let maxK = 5; // Number of Fourier terms
    let maxMaxK = 20; // Maximum number of Fourier terms

    // Drawn points and computed coefficients
    let drawnPoints = [];
    let coefs = null;
    let coefsActivity = {
        a0: true,
        ak: Array(maxMaxK).fill(true),
        bk: Array(maxMaxK).fill(true),
    };

    // Reference to canvas for clearing
    let canvasRef;

    // Handle new drawing
    function handleDraw(event) {
        drawnPoints = event.detail.points;
        if (drawnPoints.length > 1) {
            coefs = computeFourierCoefs(drawnPoints, a, b, maxK);
        }
    }

    // Recompute when maxK changes
    $: if (drawnPoints.length > 1) {
        coefs = computeFourierCoefs(drawnPoints, a, b, maxK);
    }

    // Generate Fourier approximation samples
    function getActiveCoefs(coefs, coefsActivity) {
        return {
            a0: coefsActivity.a0 ? coefs.a0 : 0,
            ak: coefs.ak.map((val, i) => (coefsActivity.ak[i] ? val : 0)),
            bk: coefs.bk.map((val, i) => (coefsActivity.bk[i] ? val : 0)),
            domain: [a, b],
        };
    }
    $: approxPoints = coefs
        ? sampleFunction(
              fourierApprox(getActiveCoefs(coefs, coefsActivity)),
              0,
              10,
              300,
          )
        : [];

    // Generate individual term samples
    function getTermsFunctions(type, coefs, coefsActivity) {
        return coefs.map((c, i) => ({
            points: sampleFunction(
                (x) =>
                    c * Math[type]((2 * (i + 1) * Math.PI * (x - a)) / (b - a)),
                0,
                10,
                200,
            ),
            color: `hsl(${(i * 360) / maxK}, 70%, 50%)`,
            label: `${type === "cos" ? "a" : "b"}${i + 1}`,
            dashed: !coefsActivity[i],
        }));
    }

    function clearCanvas() {
        drawnPoints = [];
        coefs = null;
        if (canvasRef) canvasRef.clear();
    }

    function handleDomainChange(event) {
        const { index, value } = event.detail;
        if (index === 0) {
            // Update a, ensure it doesn't cross b
            a = Math.min(value, b - 0.5);
        } else {
            // Update b, ensure it doesn't cross a
            b = Math.max(value, a + 0.5);
        }
    }
</script>

<main>
    <div class="centered-column">
        <h1>Séries de Fourier</h1>
        <p class="subtitle">
            Dessinez une fonction et visualisez son approximation par série de
            Fourier
        </p>

        <section class="controls">
            <div class="control-group">
                <label>
                    <span>Domaine: a = </span>
                    <input
                        type="number"
                        bind:value={a}
                        min="0"
                        max={b - 1}
                        step="0.5"
                    />
                </label>
                <label>
                    <span>b = </span>
                    <input
                        type="number"
                        bind:value={b}
                        min={a + 1}
                        max="10"
                        step="0.5"
                    />
                </label>
            </div>
            <div class="control-group">
                <label>
                    <span>Nombre de termes (k): </span>
                    <input
                        type="range"
                        bind:value={maxK}
                        min="1"
                        max={maxMaxK}
                        step="1"
                    />
                    <span class="value">{maxK}</span>
                </label>
            </div>
        </section>

        <section class="drawing-section">
            <div class="control-group">
                <div>
                    <h2>Dessinez votre fonction</h2>
                    <p>Tracez entre les lignes rouges (a = {a} et b = {b})</p>
                </div>
                {#if drawnPoints.length > 1}
                    <button on:click={clearCanvas}>Effacer</button>
                {/if}
            </div>

            <DrawingCanvas
                bind:this={canvasRef}
                height={350}
                domainMarks={[a, b]}
                on:draw={handleDraw}
                on:domainChange={handleDomainChange}
            />
        </section>

        {#if coefs}
            <section class="plots">
                <h2>Approximation de Fourier</h2>
                <FunctionPlot
                    height={350}
                    xDomain={[0, 10]}
                    yDomain={[0, 10]}
                    lines={[
                        { points: approxPoints, color: "#2563eb", width: 2 },
                    ]}
                    title="f(x) ≈ a₀/2 + Σ(aₖcos + bₖsin)"
                />

                <div class="coef-constant">
                    <span class="title">Terme constant:</span>
                    <label
                        style="display: inline"
                        class={["coef", coefsActivity.a0 && "active"]}
                    >
                        <input
                            type="checkbox"
                            bind:checked={coefsActivity.a0}
                        />
                        <span class="coef-name">a0 / 2</span>
                        <span class="coef-value"
                            >{(coefs.a0 / 2).toFixed(3)}</span
                        >
                    </label>
                </div>
            </section>
        {:else}
            <p class="hint">
                👆 Dessinez une courbe ci-dessus pour voir les résultats
            </p>
        {/if}
    </div>

    {#if coefs}
        <div class="terms-container">
            <div class="term-group">
                <h2>Termes cosinus</h2>
                <FunctionPlot
                    height={220}
                    xDomain={[0, 10]}
                    yDomain={[-2, 2]}
                    lines={getTermsFunctions("cos", coefs.ak, coefsActivity.ak)}
                    title="aₖ · cos(2kπ(x-a)/(b-a))"
                />

                <div class="results">
                    <div class="coefs-display">
                        {#each coefs.ak as c, i}
                            <label
                                class={[
                                    "coef",
                                    coefsActivity.ak[i] && "active",
                                ]}
                            >
                                <input
                                    type="checkbox"
                                    bind:checked={coefsActivity.ak[i]}
                                />
                                <span class="coef-name">a{i + 1}</span>
                                <span class="coef-value">{c.toFixed(3)}</span>
                            </label>
                        {/each}
                    </div>
                </div>
            </div>

            <div class="term-group">
                <h2>Termes sinus</h2>
                <FunctionPlot
                    height={220}
                    xDomain={[0, 10]}
                    yDomain={[-2, 2]}
                    lines={getTermsFunctions("sin", coefs.bk, coefsActivity.bk)}
                    title="bₖ · sin(2kπ(x-a)/(b-a))"
                />

                <div class="results">
                    <div class="coefs-display">
                        {#each coefs.bk as c, i}
                            <label
                                class={[
                                    "coef",
                                    coefsActivity.bk[i] && "active",
                                ]}
                            >
                                <input
                                    type="checkbox"
                                    bind:checked={coefsActivity.bk[i]}
                                />
                                <span class="coef-name">b{i + 1}</span>
                                <span class="coef-value">{c.toFixed(3)}</span>
                            </label>
                        {/each}
                    </div>
                </div>
            </div>
        </div>
    {/if}
</main>

<style>
    :global(body) {
        margin: 0;
        font-family:
            -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        background: #f8fafc;
    }

    main {
        max-width: 700px;
        margin: 0 auto;
        padding: 2rem;
    }

    /* Column for top elements */
    .centered-column {
        max-width: 700px;
        margin: 0 auto;
        width: 100%;
    }

    /* Layout for terms container */
    .terms-container {
        display: flex;
        flex-direction: column;
        gap: 2rem;
        margin-top: 2rem;
    }

    @media (min-width: 1024px) {
        /* When screen is large, allow main to expand for the terms container */
        main {
            max-width: 1200px;
            margin: 0 auto;
        }

        .terms-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
            align-items: start;
        }
    }

    h1 {
        color: #1e293b;
        margin-bottom: 0.25rem;
    }

    h2 {
        color: #334155;
        font-size: 1.1rem;
        margin: 1.5rem 0 0.75rem;
    }

    .subtitle {
        color: #64748b;
        margin-top: 0;
        margin-bottom: 1.5rem;
    }

    .controls {
        background: white;
        padding: 1rem 1.25rem;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
        margin-bottom: 1.5rem;
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        align-items: center;
    }

    .control-group {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    label {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        color: #475569;
        font-size: 0.9rem;
    }

    input[type="number"] {
        width: 60px;
        padding: 0.35rem 0.5rem;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-size: 0.9rem;
    }

    input[type="range"] {
        width: 120px;
    }

    .value {
        font-weight: 600;
        color: #2563eb;
        min-width: 1.5rem;
    }

    button {
        background: #ef4444;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9rem;
        margin-left: auto;
    }

    button:hover {
        background: #dc2626;
    }

    .drawing-section p {
        color: #64748b;
        font-size: 0.9rem;
        margin: 0.5rem 0;
    }

    .results {
        background: white;
        padding: 1rem 1.25rem;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
        margin: 1.5rem 0;
    }

    .coefs-display {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .coef {
        background: #f1f5f9;
        padding: 0.35rem 0.75rem;
        border-radius: 6px;
        display: flex;
        gap: 0.5rem;
        font-size: 0.85rem;
    }

    .coef.active {
        background: #e5e7eb;
    }

    .coef-name {
        color: #64748b;
        font-weight: 500;
    }

    .coef-value {
        color: #1e293b;
        font-family: "SF Mono", Monaco, monospace;
    }

    .plots {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .hint {
        text-align: center;
        color: #94a3b8;
        font-size: 1.1rem;
        margin-top: 3rem;
    }

    .coef-constant {
        margin: 1.5rem 0 0.75rem;
    }
    .coef-constant .title {
        color: #334155;
        font-size: 1.1rem;
    }
</style>
