<script>
    import FunctionPlot from "./FunctionPlot.svelte";

    let {
        basisType,
        isPlaying,
        onTogglePlay,
        approxPoints,
        xDomain,
        yDomain,
        a,
        b,
        coefs,
        coefsActivity,
        onToggleC0,
    } = $props();
</script>

<section class="plots">
    <div class="header-row">
        <h2>Approximation de Fourier</h2>
        {#if ["standard", "cos", "sin"].includes(basisType)}
            <button
                class="icon-btn"
                onclick={onTogglePlay}
                aria-label={isPlaying ? "Arrêter le son" : "Jouer le son"}
                title={isPlaying ? "Arrêter le son" : "Jouer le son"}
            >
                {#if isPlaying}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        ><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect></svg
                    >
                {:else}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        ><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path
                            d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"
                        ></path></svg
                    >
                {/if}
            </button>
        {/if}
    </div>

    <FunctionPlot
        height={350}
        {xDomain}
        {yDomain}
        lines={[{ points: approxPoints, color: "#2563eb", width: 2 }]}
        title=""
        vertical_lines={[a, b]}
    />

    <div class="coef-constant">
        <span class="title">Terme constant:</span>
        <label style="display: inline" class:active={coefsActivity.c0}>
            <input
                type="checkbox"
                checked={coefsActivity.c0}
                onchange={(event) => onToggleC0(event.currentTarget.checked)}
            />
            <span class="coef-name">c₀</span>
            <span class="coef-value">{coefs.c0.toFixed(3)}</span>
        </label>
    </div>
</section>

<style>
    h2 {
        color: #334155;
        font-size: 1.1rem;
        margin: 1.5rem 0 0.75rem;
    }

    .plots {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .icon-btn {
        border: none;
        border-radius: 6px;
        padding: 0.5rem;
        background: transparent;
        color: #64748b;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: 0;
        cursor: pointer;
    }

    .icon-btn:hover {
        background: #f1f5f9;
        color: #2563eb;
    }

    .coef-constant {
        margin: 1.5rem 0 0.75rem;
    }

    .coef-constant .title {
        color: #334155;
        font-size: 1.1rem;
    }

    .coef-name {
        color: #64748b;
        font-weight: 500;
    }

    .coef-value {
        color: #1e293b;
        font-family: "SF Mono", Monaco, monospace;
    }

    label {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        color: #475569;
        font-size: 0.9rem;
    }
</style>
