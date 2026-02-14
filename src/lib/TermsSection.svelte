<script>
    import FunctionPlot from "./FunctionPlot.svelte";
    import BarChart from "./BarChart.svelte";

    let {
        currentSystemConfig,
        xDomain,
        a,
        b,
        coefs,
        coefsActivity,
        getTermsFunctions,
        getFrequencyDomain,
        allActive,
        allInactive,
        onSetAllFamilyCoefs,
        onToggleFamilyCoef,
    } = $props();
</script>

<div
    class={currentSystemConfig.families.length > 1
        ? "terms-container two-cols"
        : "terms-container single-col"}
>
    {#each currentSystemConfig.families as familyConfig, familyIndex}
        <div class="term-group">
            <h2>{familyConfig.title}</h2>
            <FunctionPlot
                height={220}
                {xDomain}
                yDomain={[-2, 2]}
                lines={getTermsFunctions(familyIndex, familyConfig)}
                title={familyConfig.plotTitle}
                vertical_lines={[a, b]}
            />

            <div class="chart-wrap">
                <BarChart
                    data={coefs.families[familyIndex].coefs}
                    labels={coefs.families[familyIndex].coefs.map((_, index) => index + 1)}
                    height={150}
                    yDomain={getFrequencyDomain()}
                    active={coefsActivity.families[familyIndex]}
                />
            </div>

            <div class="results">
                <div class="coefs-display">
                    {#each coefs.families[familyIndex].coefs as coef, coefIndex}
                        <label
                            class="coef"
                            class:active={coefsActivity.families[familyIndex]?.[coefIndex]}
                        >
                            <input
                                type="checkbox"
                                checked={coefsActivity.families[familyIndex][coefIndex]}
                                onchange={(event) =>
                                    onToggleFamilyCoef(
                                        familyIndex,
                                        coefIndex,
                                        event.currentTarget.checked,
                                    )}
                            />
                            <span class="coef-name">{familyConfig.coefPrefix}{coefIndex + 1}</span>
                            <span class="coef-value">{coef.toFixed(3)}</span>
                        </label>
                    {/each}
                </div>
                <div class="bulk-actions">
                    <button
                        class="text-btn"
                        disabled={allActive(familyIndex)}
                        onclick={() => onSetAllFamilyCoefs(familyIndex, true)}
                    >
                        Tout activer
                    </button>
                    <button
                        class="text-btn"
                        disabled={allInactive(familyIndex)}
                        onclick={() => onSetAllFamilyCoefs(familyIndex, false)}
                    >
                        Tout désactiver
                    </button>
                </div>
            </div>
        </div>
    {/each}
</div>

<style>
    .terms-container {
        display: flex;
        flex-direction: column;
        gap: 2rem;
        margin-top: 2rem;
        width: 100%;
        margin-left: auto;
        margin-right: auto;
    }

    .terms-container.single-col {
        max-width: 700px;
    }

    @media (min-width: 1024px) {
        .terms-container.two-cols {
            display: flex;
            flex-direction: row;
            gap: 2rem;
            align-items: start;
            max-width: 1200px;
        }

        .terms-container.single-col {
            max-width: 700px;
        }
    }

    .term-group {
        flex: 1 1 0;
        min-width: 0;
    }

    h2 {
        color: #334155;
        font-size: 1.1rem;
        margin: 1.5rem 0 0.75rem;
    }

    .chart-wrap {
        margin-top: 1rem;
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

    .bulk-actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #e2e8f0;
    }

    .text-btn {
        border: 1px solid #bfdbfe;
        border-radius: 6px;
        background-color: #eff6ff;
        color: #2563eb;
        padding: 0.25rem 0.5rem;
        font-size: 0.8rem;
        margin: 0;
        cursor: pointer;
    }

    .text-btn:hover {
        background-color: #dbeafe;
    }

    .text-btn:disabled {
        color: #94a3b8;
        border-color: #e2e8f0;
        background-color: #f8fafc;
        cursor: not-allowed;
    }

    label {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        color: #475569;
        font-size: 0.9rem;
    }
</style>
