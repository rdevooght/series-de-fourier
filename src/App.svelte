<script>
    import DrawingCanvas from "./lib/DrawingCanvas.svelte";
    import FunctionPlot from "./lib/FunctionPlot.svelte";
    import Footer from "./lib/Footer.svelte";
    import {
        computeFourierCoefs,
        fourierApprox,
        sampleFunction,
        getSystem,
    } from "./lib/fourier.js";

    // ========================================================================
    // Systems Configuration
    // ========================================================================

    const SYSTEMS_CONFIG = {
        standard: {
            id: "standard",
            label: "Standard (½, sin, cos)",
            families: [
                {
                    id: "cos",
                    title: "Termes cosinus",
                    plotTitle: "aₖ · cos(2kπx/(b-a))",
                    coefPrefix: "a",
                },
                {
                    id: "sin",
                    title: "Termes sinus",
                    plotTitle: "bₖ · sin(2kπx/(b-a))",
                    coefPrefix: "b",
                },
            ],
        },
        cos: {
            id: "cos",
            label: "Cosinus",
            families: [
                {
                    id: "cos",
                    title: "Termes cosinus",
                    plotTitle: "aₖ · cos(kπ(x-a)/(b-a))",
                    coefPrefix: "a",
                },
            ],
        },
        sin: {
            id: "sin",
            label: "Sinus",
            families: [
                {
                    id: "sin",
                    title: "Termes sinus",
                    plotTitle: "bₖ · sin(kπ(x-a)/(b-a))",
                    coefPrefix: "b",
                },
            ],
        },
        chebyshev: {
            id: "chebyshev",
            label: "Tchebychev",
            families: [
                {
                    id: "T",
                    title: "Polynômes de Tchebychev Tₖ",
                    plotTitle: "aₖ · Tₖ(x)",
                    coefPrefix: "T",
                },
            ],
        },
    };

    // Order for display in UI
    const SYSTEM_ORDER = ["standard", "sin", "cos", "chebyshev"];

    // ========================================================================
    // Domain and general parameters
    // ========================================================================

    let a = $state(-Math.PI);
    let b = $state(Math.PI);
    let xDomain = $state([-5, 5]);
    let yDomain = $state([-5, 5]);

    let maxK = $state(5);
    let maxMaxK = $state(20);
    let basisType = $state("standard");

    // Current system config derived reactively
    let currentSystemConfig = $derived(SYSTEMS_CONFIG[basisType]);

    // ========================================================================
    // Sample functions
    // ========================================================================

    const sampleFunctions = [
        {
            name: "sin(x)",
            func: (x) => Math.sin(x),
            domain: [-Math.PI, Math.PI],
        },
        {
            name: "x²",
            func: (x) => x ** 2,
            domain: [-2, 2],
        },
        {
            name: "e^x",
            func: (x) => Math.exp(x),
            domain: [-1, 1],
        },
        {
            name: "step",
            func: (x) => (x > 0 ? 1 : -1),
            domain: [-1, 1],
        },
        {
            name: "dents de scie",
            func: (x) => x - Math.floor(x),
            domain: [0, 1],
        },
    ];

    function setFunction(func) {
        if (func.domain) {
            a = func.domain[0];
            b = func.domain[1];
        }
        drawnPoints = sampleFunction(func.func, xDomain[0], xDomain[1], 1000);
    }

    // ========================================================================
    // Drawn points and computed coefficients
    // ========================================================================

    let drawnPoints = $state([]);
    let coefs = $derived.by(() => {
        if (drawnPoints && drawnPoints.length > 1) {
            return computeFourierCoefs(drawnPoints, a, b, maxK, basisType);
        } else {
            return null;
        }
    });

    // Activity state: c0 and per-family coefficient toggle
    // families is an array of boolean arrays, one per family
    let coefsActivity = $state({
        c0: true,
        families: [Array(maxMaxK).fill(true), Array(maxMaxK).fill(true)],
    });

    // ========================================================================
    // Approximation with active coefficients
    // ========================================================================

    function getActiveCoefs(coefs, coefsActivity) {
        return {
            type: coefs.type,
            c0: coefsActivity.c0 ? coefs.c0 : 0,
            families: coefs.families.map((fam, fi) => ({
                id: fam.id,
                coefs: fam.coefs.map((val, i) =>
                    coefsActivity.families[fi]?.[i] ? val : 0,
                ),
            })),
            domain: coefs.domain,
        };
    }

    let approxPoints = $derived(
        coefs
            ? sampleFunction(
                  fourierApprox(getActiveCoefs(coefs, coefsActivity)),
                  xDomain[0],
                  xDomain[1],
                  300,
              )
            : [],
    );

    // ========================================================================
    // Term plotting
    // ========================================================================

    function getTermsFunctions(familyIndex, familyConfig) {
        if (!coefs || !coefs.families[familyIndex]) return [];

        const system = getSystem(basisType);
        const famDef = system.families[familyIndex];
        const famCoefs = coefs.families[familyIndex].coefs;
        const famActivity = coefsActivity.families[familyIndex] || [];

        return famCoefs.map((c, i) => {
            const func = (x) => c * famDef.evalTerm(i + 1, x, a, b);

            return {
                points: sampleFunction(func, xDomain[0], xDomain[1], 200),
                color: `hsl(${(i * 360) / maxK}, 70%, 50%)`,
                label: `${familyConfig.coefPrefix}${i + 1}`,
                dashed: !famActivity[i],
            };
        });
    }

    // ========================================================================
    // UI helpers
    // ========================================================================

    function clearCanvas() {
        drawnPoints = [];
        coefs = null;
    }

    // Check if all or no coefficients of a family are active
    function allActive(familyIndex) {
        const famActivity = coefsActivity.families[familyIndex];
        if (!famActivity) return false;
        return famActivity.slice(0, maxK).every((v) => v);
    }

    function allInactive(familyIndex) {
        const famActivity = coefsActivity.families[familyIndex];
        if (!famActivity) return true;
        return famActivity.slice(0, maxK).every((v) => !v);
    }

    function setAllFamilyCoefs(familyIndex, active) {
        coefsActivity.families[familyIndex] = coefsActivity.families[
            familyIndex
        ].map((v, i) => (i < maxK ? active : v));
    }

    function activateAllCoefs() {
        for (
            let familyIndex = 0;
            familyIndex < coefsActivity.families.length;
            familyIndex++
        ) {
            setAllFamilyCoefs(familyIndex, true);
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
            <div class="control-group basis-selector">
                <span class="label">Base: </span>
                <div class="radio-group">
                    {#each SYSTEM_ORDER as systemId}
                        <label class:selected={basisType === systemId}>
                            <input
                                type="radio"
                                name="basis"
                                value={systemId}
                                bind:group={basisType}
                                onclick={activateAllCoefs}
                            />
                            {SYSTEMS_CONFIG[systemId].label}
                        </label>
                    {/each}
                </div>
            </div>
        </section>

        <section class="drawing-section">
            <div class="control-group">
                <div>
                    <h2>Dessinez votre fonction</h2>
                    <p>
                        Tracez entre les lignes rouges (a = {a.toFixed(2)} et b =
                        {b.toFixed(2)})
                    </p>
                </div>
                {#if drawnPoints.length > 1}
                    <button onclick={clearCanvas}>Effacer</button>
                {/if}
            </div>

            <div id="function-picker">
                <p>Ou choisissez parmi les fonctions suivantes :</p>
                <ul>
                    {#each sampleFunctions as func}
                        <li>
                            <input
                                type="button"
                                name="function"
                                value={func.name}
                                onclick={() => setFunction(func)}
                            />
                        </li>
                    {/each}
                </ul>
            </div>

            <DrawingCanvas
                height={350}
                {xDomain}
                {yDomain}
                bind:points={drawnPoints}
                bind:a
                bind:b
            />
        </section>

        {#if coefs}
            <section class="plots">
                <h2>Approximation de Fourier</h2>
                <FunctionPlot
                    height={350}
                    {xDomain}
                    {yDomain}
                    lines={[
                        { points: approxPoints, color: "#2563eb", width: 2 },
                    ]}
                    title=""
                />

                <div class="coef-constant">
                    <span class="title">Terme constant:</span>
                    <label
                        style="display: inline"
                        class:active={coefsActivity.c0}
                    >
                        <input
                            type="checkbox"
                            bind:checked={coefsActivity.c0}
                        />
                        <span class="coef-name">c₀</span>
                        <span class="coef-value">{coefs.c0.toFixed(3)}</span>
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
        <div
            class={currentSystemConfig.families.length > 1
                ? "terms-container two-cols"
                : "terms-container single-col"}
        >
            {#each currentSystemConfig.families as familyConfig, fi}
                <div class="term-group">
                    <h2>{familyConfig.title}</h2>
                    <FunctionPlot
                        height={220}
                        {xDomain}
                        yDomain={[-2, 2]}
                        lines={getTermsFunctions(fi, familyConfig)}
                        title={familyConfig.plotTitle}
                    />

                    <div class="results">
                        <div class="coefs-display">
                            {#each coefs.families[fi].coefs as c, i}
                                <label
                                    class={[
                                        "coef",
                                        coefsActivity.families[fi]?.[i] &&
                                            "active",
                                    ]}
                                >
                                    <input
                                        type="checkbox"
                                        bind:checked={
                                            coefsActivity.families[fi][i]
                                        }
                                    />
                                    <span class="coef-name"
                                        >{familyConfig.coefPrefix}{i + 1}</span
                                    >
                                    <span class="coef-value"
                                        >{c.toFixed(3)}</span
                                    >
                                </label>
                            {/each}
                        </div>
                        <div class="bulk-actions">
                            <button
                                class="text-btn"
                                disabled={allActive(fi)}
                                onclick={() => setAllFamilyCoefs(fi, true)}
                            >
                                Tout activer
                            </button>
                            <button
                                class="text-btn"
                                disabled={allInactive(fi)}
                                onclick={() => setAllFamilyCoefs(fi, false)}
                            >
                                Tout désactiver
                            </button>
                        </div>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</main>

<Footer />

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
        width: 100%;
        margin-left: auto;
        margin-right: auto;
    }

    /* Default single column (mobile or desktop single family) */
    .terms-container.single-col {
        max-width: 700px;
    }

    /* Large screen rules */
    @media (min-width: 1024px) {
        main {
            /* Allow main to grow to accommodate 2 cols */
            max-width: 1200px;
        }

        .terms-container.two-cols {
            display: flex;
            flex-direction: row;
            gap: 2rem;
            align-items: start;
            max-width: 1200px; /* Use full available width */
        }

        /* Single col stays centered and same width as top part */
        .terms-container.single-col {
            max-width: 700px;
        }
    }

    .term-group {
        flex: 1 1 0;
        min-width: 0;
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

    .basis-selector {
        width: 100%;
        margin-top: 0.5rem;
    }

    .radio-group {
        display: flex;
        background: #f1f5f9;
        padding: 4px;
        border-radius: 8px;
        gap: 4px;
        flex-wrap: wrap;
    }

    .radio-group label {
        padding: 6px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9rem;
        color: #64748b;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        user-select: none;
    }

    .radio-group label:hover {
        background: #e2e8f0;
        color: #334155;
    }

    .radio-group label.selected {
        background: white;
        color: #2563eb;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        font-weight: 500;
    }

    .radio-group input {
        display: none;
    }

    .label {
        color: #475569;
        font-size: 0.9rem;
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

    button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .bulk-actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #e2e8f0;
    }

    .text-btn {
        background: none;
        color: #2563eb;
        padding: 0.25rem 0.5rem;
        font-size: 0.8rem;
        margin: 0;
        border: 1px solid #bfdbfe;
        background-color: #eff6ff;
    }

    .text-btn:hover {
        background-color: #dbeafe;
    }

    .text-btn:disabled {
        color: #94a3b8;
        border-color: #e2e8f0;
        background-color: #f8fafc;
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

    #function-picker {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        margin-bottom: 15px;
    }

    #function-picker ul {
        list-style-type: none;
        padding: 0;
        margin: 0;

        display: flex;
        flex-wrap: wrap;
        gap: 5px;
    }

    #function-picker ul input[type="button"] {
        cursor: pointer;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        border: 1px solid #e5e7eb;
        background-color: #f1f5f9;
    }

    #function-picker ul input[type="button"]:hover {
        background-color: #e5e7eb;
    }
</style>
