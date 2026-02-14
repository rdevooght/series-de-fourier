<script>
    let {
        a = $bindable(),
        b = $bindable(),
        maxK = $bindable(),
        maxMaxK,
        basisType = $bindable(),
        systemOrder,
        systemsConfig,
        onSetBasis,
    } = $props();
</script>

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
            {#each systemOrder as systemId}
                <label class:selected={basisType === systemId}>
                    <input
                        type="radio"
                        name="basis"
                        value={systemId}
                        bind:group={basisType}
                        onclick={() => onSetBasis(systemId)}
                    />
                    {systemsConfig[systemId].label}
                </label>
            {/each}
        </div>
    </div>
</section>

<style>
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
</style>
