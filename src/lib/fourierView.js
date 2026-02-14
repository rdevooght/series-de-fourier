import { getSystem, sampleFunction } from "./fourier.js";

export function getActiveCoefs(coefs, coefsActivity) {
    return {
        type: coefs.type,
        c0: coefsActivity.c0 ? coefs.c0 : 0,
        families: coefs.families.map((family, familyIndex) => ({
            id: family.id,
            coefs: family.coefs.map((value, index) =>
                coefsActivity.families[familyIndex]?.[index] ? value : 0,
            ),
        })),
        domain: coefs.domain,
    };
}

export function getTermsFunctions({
    coefs,
    coefsActivity,
    basisType,
    a,
    b,
    xDomain,
    maxK,
    familyIndex,
    familyConfig,
}) {
    if (!coefs || !coefs.families[familyIndex]) return [];

    const system = getSystem(basisType);
    const familyDefinition = system.families[familyIndex];
    const familyCoefs = coefs.families[familyIndex].coefs;
    const familyActivity = coefsActivity.families[familyIndex] || [];

    return familyCoefs.map((coef, index) => {
        const func = (x) => {
            const term = familyDefinition.evalTerm(index + 1, x, a, b);
            if (term === null) {
                return null;
            }
            return coef * term;
        };

        return {
            points: sampleFunction(func, xDomain[0], xDomain[1], 200),
            color: `hsl(${(index * 360) / maxK}, 70%, 50%)`,
            label: `${familyConfig.coefPrefix}${index + 1}`,
            dashed: !familyActivity[index],
        };
    });
}

export function getFrequencyDomain(coefs, familyCount) {
    const allCoefs = [];
    for (let familyIndex = 0; familyIndex < familyCount; familyIndex++) {
        allCoefs.push(...coefs.families[familyIndex].coefs);
    }

    const min = Math.min(...allCoefs);
    const max = Math.max(...allCoefs);
    const range = Math.ceil(Math.max(Math.abs(min), Math.abs(max)));

    return [min < 0 ? -range : 0, max < 0 ? 0 : range];
}
