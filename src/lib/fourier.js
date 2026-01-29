/**
 * Fourier series computation utilities
 * Adapted from Observable notebook
 */

/**
 * Clean a curve by removing points where x decreases (ensures monotonic x)
 */
export function cleanCurve(points) {
    if (points.length === 0) return [];

    const cleaned = [points[0]];
    let maxX = points[0][0];

    for (let i = 1; i < points.length; i++) {
        if (points[i][0] > maxX) {
            cleaned.push(points[i]);
            maxX = points[i][0];
        }
    }

    return cleaned;
}

/**
 * Linear interpolation at x between two points
 */
export function interpolate(x, x1, y1, x2, y2) {
    return y1 + ((x - x1) * (y2 - y1)) / (x2 - x1);
}

/**
 * Integrate a curve (list of [x, y] points) using trapezoidal rule
 */
export function integrate(points, a, b) {
    const cleanedPoints = cleanCurve(points);
    if (cleanedPoints.length < 2) return null;

    // Find segments containing a and b
    let startIdx = 0;
    while (startIdx < cleanedPoints.length - 1 && cleanedPoints[startIdx + 1][0] < a) startIdx++;

    let endIdx = cleanedPoints.length - 1;
    while (endIdx > 0 && cleanedPoints[endIdx - 1][0] > b) endIdx--;

    if (startIdx >= endIdx) return null;

    let integral = 0;
    const firstX = Math.max(a, cleanedPoints[startIdx][0]);
    const lastX = Math.min(b, cleanedPoints[endIdx][0]);

    for (let i = startIdx; i < endIdx; i++) {
        const x1 = i === startIdx ? firstX : cleanedPoints[i][0];
        const x2 = i === endIdx - 1 ? lastX : cleanedPoints[i + 1][0];

        let y1 = cleanedPoints[i][1];
        let y2 = cleanedPoints[i + 1][1];

        if (i === startIdx && x1 > cleanedPoints[i][0]) {
            y1 = interpolate(x1, cleanedPoints[i][0], cleanedPoints[i][1],
                cleanedPoints[i + 1][0], cleanedPoints[i + 1][1]);
        }
        if (i === endIdx - 1 && x2 < cleanedPoints[i + 1][0]) {
            y2 = interpolate(x2, cleanedPoints[i][0], cleanedPoints[i][1],
                cleanedPoints[i + 1][0], cleanedPoints[i + 1][1]);
        }

        integral += ((x2 - x1) * (y1 + y2)) / 2;
    }

    return integral;
}

/**
 * Oversample a curve to ensure enough points for accurate integration
 */
export function oversample(points, a, b, k) {
    const minPointsPerPeriod = 10;
    const period = (b - a) / (2 * k);
    const desiredN = Math.ceil(((b - a) / period) * minPointsPerPeriod);

    if (points.length < desiredN) {
        const interpolatedPoints = [];
        let j = 0;
        for (let i = 0; i < desiredN; i++) {
            const x = a + ((b - a) * i) / (desiredN - 1);
            while (j < points.length - 1 && points[j][0] < x) j++;
            if (j === 0) j = 1;
            const y = points[j - 1][1] +
                ((x - points[j - 1][0]) * (points[j][1] - points[j - 1][1])) /
                (points[j][0] - points[j - 1][0]);
            interpolatedPoints.push([x, y]);
        }
        return interpolatedPoints;
    }
    return points;
}

/**
 * Compute a0 coefficient (constant term)
 */
export function computeA0(curve, a, b) {
    return integrate(curve, a, b) * 2 / (b - a);
}

/**
 * Compute ak coefficient (cosine terms)
 */
export function computeAk(curve, a, b, k) {
    const oversampled = oversample(curve, a, b, k);
    const productCurve = oversampled.map((p) => [
        p[0],
        p[1] * Math.cos((2 * k * Math.PI * (p[0] - a)) / (b - a))
    ]);
    return (integrate(productCurve, a, b) * 2) / (b - a);
}

/**
 * Compute bk coefficient (sine terms)
 */
export function computeBk(curve, a, b, k) {
    const oversampled = oversample(curve, a, b, k);
    const productCurve = oversampled.map((p) => [
        p[0],
        p[1] * Math.sin((2 * k * Math.PI * (p[0] - a)) / (b - a))
    ]);
    return (integrate(productCurve, a, b) * 2) / (b - a);
}

/**
 * Compute all Fourier coefficients up to max_k
 */
export function computeFourierCoefs(curve, a, b, maxK) {
    const coefs = {
        a0: computeA0(curve, a, b),
        ak: [],
        bk: [],
        domain: [a, b]
    };

    for (let k = 1; k <= maxK; k++) {
        coefs.ak.push(computeAk(curve, a, b, k));
        coefs.bk.push(computeBk(curve, a, b, k));
    }
    return coefs;
}

/**
 * Create a function that evaluates the Fourier approximation
 */
export function fourierApprox(coefs) {
    const maxK = coefs.ak.length;
    const T = coefs.domain[1] - coefs.domain[0];
    const a = coefs.domain[0];

    return function (x) {
        let y = coefs.a0 / 2;
        for (let k = 1; k <= maxK; k++) {
            y += coefs.ak[k - 1] * Math.cos((2 * k * Math.PI * (x - a)) / T);
            y += coefs.bk[k - 1] * Math.sin((2 * k * Math.PI * (x - a)) / T);
        }
        return y;
    };
}

/**
 * Sample a function at uniform x values for plotting
 */
export function sampleFunction(f, xMin, xMax, n = 200) {
    const points = [];
    for (let i = 0; i <= n; i++) {
        const x = xMin + (xMax - xMin) * i / n;
        points.push([x, f(x)]);
    }
    return points;
}
