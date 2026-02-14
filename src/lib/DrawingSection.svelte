<script>
    import DrawingCanvas from "./DrawingCanvas.svelte";

    let {
        a = $bindable(),
        b = $bindable(),
        drawnPoints = $bindable([]),
        xDomain,
        yDomain,
        sampleFunctions,
        onClear,
        onSelectSample,
    } = $props();
</script>

<section class="drawing-section">
    <div class="control-group not-boxed">
        <div>
            <h2>Dessinez votre fonction</h2>
            <p>
                Tracez entre les lignes rouges (a = {a.toFixed(2)} et b = {b.toFixed(
                    2,
                )})
            </p>
        </div>
        {#if drawnPoints.length > 1}
            <button class="clear-btn" onclick={onClear}>Effacer</button>
        {/if}
    </div>

    <div id="function-picker" class="not-boxed">
        <p>Ou choisissez parmi les fonctions suivantes :</p>
        <ul>
            {#each sampleFunctions as sampleFunction}
                <li>
                    <input
                        type="button"
                        name="function"
                        value={sampleFunction.name}
                        onclick={() => onSelectSample(sampleFunction)}
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

<style>
    h2 {
        color: #334155;
        font-size: 1.1rem;
        margin: 1.5rem 0 0.75rem;
    }

    .not-boxed {
        padding: 0 10px;
    }

    .control-group {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .drawing-section p {
        color: #64748b;
        font-size: 0.9rem;
        margin: 0.5rem 0;
    }

    .clear-btn {
        background: #ef4444;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9rem;
        margin-left: auto;
    }

    .clear-btn:hover {
        background: #dc2626;
    }

    .clear-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
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
