<script>
    import { Parser } from "expr-eval-fork";
    import Footer from "./lib/Footer.svelte";
    import ControlsPanel from "./lib/ControlsPanel.svelte";
    import DrawingSection from "./lib/DrawingSection.svelte";
    import ApproximationSection from "./lib/ApproximationSection.svelte";
    import TermsSection from "./lib/TermsSection.svelte";
    import {
        computeFourierCoefs,
        fourierApprox,
        sampleFunction,
    } from "./lib/fourier.js";
    import { togglePlay, updateSound, stopSound } from "./lib/sound.js";
    import {
        SYSTEMS_CONFIG,
        SYSTEM_ORDER,
        SAMPLE_FUNCTIONS,
    } from "./lib/systems.js";
    import {
        getActiveCoefs,
        getTermsFunctions as computeTermsFunctions,
        getFrequencyDomain as computeFrequencyDomain,
    } from "./lib/fourierView.js";

    let a = $state(-Math.PI);
    let b = $state(Math.PI);
    let xDomain = $state([-5, 5]);
    let yDomain = $state([-5, 5]);

    let maxK = $state(5);
    let maxMaxK = $state(20);
    let basisType = $state("standard");

    let currentSystemConfig = $derived(SYSTEMS_CONFIG[basisType]);
    let availableSampleFunctions = $state([...SAMPLE_FUNCTIONS]);

    const expressionParser = new Parser({
        operators: {
            comparison: false,
            logical: false,
            assignment: false,
            concatenate: false,
            in: false,
        },
    });

    let drawnPoints = $state([]);
    let coefs = $derived.by(() => {
        if (drawnPoints && drawnPoints.length > 1) {
            return computeFourierCoefs(drawnPoints, a, b, maxK, basisType);
        }
        return null;
    });

    let isPlaying = $state(false);

    let coefsActivity = $state({
        c0: true,
        families: [Array(maxMaxK).fill(true), Array(maxMaxK).fill(true)],
    });

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

    $effect(() => {
        if (isPlaying && coefs) {
            updateSound(coefs, coefsActivity);
        } else if (!coefs && isPlaying) {
            stopSound();
            isPlaying = false;
        }
    });

    function setFunction(sampleFunctionDef) {
        if (sampleFunctionDef.domain) {
            a = sampleFunctionDef.domain[0];
            b = sampleFunctionDef.domain[1];
        }
        drawnPoints = sampleFunction(
            sampleFunctionDef.func,
            xDomain[0],
            xDomain[1],
            1000,
        );
    }

    function addCustomFunction(expression) {
        const trimmedExpression = expression?.trim();
        if (!trimmedExpression) {
            return { ok: false, error: "Expression vide." };
        }

        const existingFunction = availableSampleFunctions.find(
            (fn) => fn.name === trimmedExpression,
        );
        if (existingFunction) {
            setFunction(existingFunction);
            return { ok: true };
        }

        try {
            const parsedExpression = expressionParser.parse(trimmedExpression);
            const usedVariables = parsedExpression.variables();

            if (usedVariables.some((variableName) => variableName !== "x")) {
                return {
                    ok: false,
                    error: "Utilisez uniquement la variable x.",
                };
            }

            const customSampleFunction = {
                name: trimmedExpression,
                func: (x) => parsedExpression.evaluate({ x }),
            };

            availableSampleFunctions = [
                ...availableSampleFunctions,
                customSampleFunction,
            ];
            setFunction(customSampleFunction);
            return { ok: true };
        } catch (_error) {
            return {
                ok: false,
                error: "Expression invalide. Exemple: abs(x+2)",
            };
        }
    }

    function clearCanvas() {
        drawnPoints = [];
    }

    function handleTogglePlay() {
        if (coefs) {
            isPlaying = togglePlay(coefs, coefsActivity);
        }
    }

    function allActive(familyIndex) {
        const familyActivity = coefsActivity.families[familyIndex];
        if (!familyActivity) return false;
        return familyActivity.slice(0, maxK).every((value) => value);
    }

    function allInactive(familyIndex) {
        const familyActivity = coefsActivity.families[familyIndex];
        if (!familyActivity) return true;
        return familyActivity.slice(0, maxK).every((value) => !value);
    }

    function setAllFamilyCoefs(familyIndex, active) {
        coefsActivity = {
            ...coefsActivity,
            families: coefsActivity.families.map((family, index) =>
                index === familyIndex
                    ? family.map((value, coefIndex) =>
                          coefIndex < maxK ? active : value,
                      )
                    : family,
            ),
        };
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

    function setBasisType(systemId) {
        basisType = systemId;
        activateAllCoefs();
    }

    function toggleC0(active) {
        coefsActivity = {
            ...coefsActivity,
            c0: active,
        };
    }

    function toggleFamilyCoef(familyIndex, coefIndex, active) {
        coefsActivity = {
            ...coefsActivity,
            families: coefsActivity.families.map((family, index) => {
                if (index !== familyIndex) return family;
                return family.map((value, indexInFamily) =>
                    indexInFamily === coefIndex ? active : value,
                );
            }),
        };
    }

    function getTermsFunctions(familyIndex, familyConfig) {
        return computeTermsFunctions({
            coefs,
            coefsActivity,
            basisType,
            a,
            b,
            xDomain,
            maxK,
            familyIndex,
            familyConfig,
        });
    }

    function getFrequencyDomain() {
        return computeFrequencyDomain(
            coefs,
            currentSystemConfig.families.length,
        );
    }
</script>

<main>
    <div class="centered-column">
        <div class="intro">
            <h1>Séries de Fourier</h1>
            <p class="subtitle">
                Dessinez une fonction et visualisez son approximation par série
                de Fourier
            </p>
        </div>

        <ControlsPanel
            bind:a
            bind:b
            bind:maxK
            {maxMaxK}
            bind:basisType
            systemOrder={SYSTEM_ORDER}
            systemsConfig={SYSTEMS_CONFIG}
            onSetBasis={setBasisType}
        />

        <DrawingSection
            bind:a
            bind:b
            bind:drawnPoints
            {xDomain}
            {yDomain}
            sampleFunctions={availableSampleFunctions}
            onClear={clearCanvas}
            onSelectSample={setFunction}
            onAddSampleExpression={addCustomFunction}
        />

        {#if coefs}
            <ApproximationSection
                {basisType}
                {isPlaying}
                onTogglePlay={handleTogglePlay}
                {approxPoints}
                {xDomain}
                {yDomain}
                {a}
                {b}
                {coefs}
                {coefsActivity}
                onToggleC0={toggleC0}
            />
        {:else}
            <p class="hint">
                👆 Dessinez une courbe ci-dessus pour voir les résultats
            </p>
        {/if}
    </div>

    {#if coefs}
        <TermsSection
            {currentSystemConfig}
            {xDomain}
            {a}
            {b}
            {coefs}
            {coefsActivity}
            {getTermsFunctions}
            {getFrequencyDomain}
            {allActive}
            {allInactive}
            onSetAllFamilyCoefs={setAllFamilyCoefs}
            onToggleFamilyCoef={toggleFamilyCoef}
        />
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
        padding: 0;
    }

    .intro {
        padding: 10px;
    }

    .centered-column {
        max-width: 700px;
        margin: 0 auto;
        width: 100%;
    }

    @media (min-width: 480px) {
        main {
            padding: 10px;
        }
    }

    @media (min-width: 1024px) {
        main {
            max-width: 1200px;
        }
    }

    h1 {
        color: #1e293b;
        margin-bottom: 0.25rem;
    }

    .subtitle {
        color: #64748b;
        margin-top: 0;
        margin-bottom: 1.5rem;
    }

    .hint {
        text-align: center;
        color: #94a3b8;
        font-size: 1.1rem;
        margin-top: 3rem;
    }
</style>
