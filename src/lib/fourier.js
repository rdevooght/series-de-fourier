/**
 * Fourier series computation utilities
 *
 * Architecture: Each basis system is defined in the SYSTEMS registry with:
 * - computeC0: computes the constant term
 * - evalC0: how the constant term contributes to the approximation sum
 * - families: array of coefficient families, each with computeCoef and evalTerm
 */

// ============================================================================
// Core utilities (shared by all systems)
// ============================================================================

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
  while (
    startIdx < cleanedPoints.length - 1 &&
    cleanedPoints[startIdx + 1][0] < a
  )
    startIdx++;

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
      y1 = interpolate(
        x1,
        cleanedPoints[i][0],
        cleanedPoints[i][1],
        cleanedPoints[i + 1][0],
        cleanedPoints[i + 1][1],
      );
    }
    if (i === endIdx - 1 && x2 < cleanedPoints[i + 1][0]) {
      y2 = interpolate(
        x2,
        cleanedPoints[i][0],
        cleanedPoints[i][1],
        cleanedPoints[i + 1][0],
        cleanedPoints[i + 1][1],
      );
    }

    integral += ((x2 - x1) * (y1 + y2)) / 2;
  }

  return integral;
}

/**
 * Oversample a curve to ensure enough points for accurate integration
 */
export function oversample(points, a, b, k, minPointsPerPeriod = 10) {
  const period = k === 0 ? b - a : (b - a) / (2 * k);
  const desiredN = Math.ceil(((b - a) / period) * minPointsPerPeriod);

  if (points.length < desiredN) {
    const interpolatedPoints = [];
    let j = 0;
    for (let i = 0; i < desiredN; i++) {
      const x = a + ((b - a) * i) / (desiredN - 1);
      while (j < points.length - 1 && points[j][0] < x) j++;
      if (j === 0) j = 1;
      const y =
        points[j - 1][1] +
        ((x - points[j - 1][0]) * (points[j][1] - points[j - 1][1])) /
          (points[j][0] - points[j - 1][0]);
      interpolatedPoints.push([x, y]);
    }
    return interpolatedPoints;
  }
  return points;
}

/**
 * Sample a function at uniform x values for plotting
 */
export function sampleFunction(f, xMin, xMax, n = 200) {
  const points = [];
  for (let i = 0; i <= n; i++) {
    const x = xMin + ((xMax - xMin) * i) / n;
    points.push([x, f(x)]);
  }
  return points;
}

// ============================================================================
// Trigonometric coefficient computation (used by standard, sin, cos systems)
// ============================================================================

/**
 * Compute trigonometric coefficient for a specific frequency
 * @param curve - the drawn curve
 * @param a, b - domain bounds
 * @param k - frequency index (1, 2, 3, ...)
 * @param trigFn - Math.cos or Math.sin
 * @param multiplier - 2 for standard (full period), 1 for half-period expansions
 * @param offset - offset for the x-coordinate
 */
function computeTrigCoef(curve, a, b, k, trigFn, multiplier, offset = 0) {
  const effK = multiplier === 2 ? k : k / 2;
  const oversampled = oversample(curve, a, b, effK);

  const productCurve = oversampled.map((p) => {
    const theta = (multiplier * k * Math.PI * (p[0] - offset)) / (b - a);
    return [p[0], p[1] * trigFn(theta)];
  });

  return (integrate(productCurve, a, b) * 2) / (b - a);
}

// ============================================================================
// Chebyshev coefficient computation
// ============================================================================

/**
 * Compute Chebyshev coefficient Tk using theta-domain integration
 */
function computeChebyshevCoef(curve, a, b, k) {
  const finePoints = oversample(curve, a, b, Math.max(k, 10));
  const mid = (a + b) / 2;
  const half = (b - a) / 2;

  const thetaPoints = [];
  const steps = 500;
  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * Math.PI;
    const x = mid + half * Math.cos(theta);

    // Interpolate y at x
    let y = 0;
    const idx = finePoints.findIndex((p) => p[0] >= x);
    if (idx === -1) y = finePoints[finePoints.length - 1][1];
    else if (idx === 0) y = finePoints[0][1];
    else {
      y = interpolate(
        x,
        finePoints[idx - 1][0],
        finePoints[idx - 1][1],
        finePoints[idx][0],
        finePoints[idx][1],
      );
    }

    thetaPoints.push([theta, y * Math.cos(k * theta)]);
  }

  const integral = integrate(thetaPoints, 0, Math.PI);
  return k === 0 ? integral / Math.PI : integral / (Math.PI / 2);
}

/**
 * Evaluate Chebyshev polynomial Tn at x (where x is in original domain [a, b])
 */
function evalChebyshevTerm(k, x, a, b) {
  const mid = (a + b) / 2;
  const half = (b - a) / 2;
  const xNorm = (x - mid) / half;

  if (xNorm >= -1 && xNorm <= 1) {
    return Math.cos(k * Math.acos(xNorm));
  } else if (xNorm > 1) {
    return Math.cosh(k * Math.acosh(xNorm));
  } else {
    return (k % 2 === 0 ? 1 : -1) * Math.cosh(k * Math.acosh(-xNorm));
  }
}

// ============================================================================
// SYSTEMS Registry
// ============================================================================

export const SYSTEMS = {
  standard: {
    id: "standard",
    computeC0: (curve, a, b) => (integrate(curve, a, b) * 2) / (b - a),
    evalC0: (c0) => c0 / 2,
    families: [
      {
        id: "cos",
        coefPrefix: "a",
        computeCoef: (curve, a, b, k) =>
          computeTrigCoef(curve, a, b, k, Math.cos, 2),
        evalTerm: (k, x, a, b) => Math.cos((2 * k * Math.PI * x) / (b - a)),
      },
      {
        id: "sin",
        coefPrefix: "b",
        computeCoef: (curve, a, b, k) =>
          computeTrigCoef(curve, a, b, k, Math.sin, 2),
        evalTerm: (k, x, a, b) => Math.sin((2 * k * Math.PI * x) / (b - a)),
      },
    ],
  },

  cos: {
    id: "cos",
    computeC0: (curve, a, b) => (integrate(curve, a, b) * 2) / (b - a),
    evalC0: (c0) => c0 / 2,
    families: [
      {
        id: "cos",
        coefPrefix: "a",
        computeCoef: (curve, a, b, k) =>
          computeTrigCoef(curve, a, b, k, Math.cos, 1, a),
        evalTerm: (k, x, a, b) => Math.cos((k * Math.PI * (x - a)) / (b - a)),
      },
    ],
  },

  sin: {
    id: "sin",
    computeC0: () => 0,
    evalC0: () => 0,
    families: [
      {
        id: "sin",
        coefPrefix: "b",
        computeCoef: (curve, a, b, k) =>
          computeTrigCoef(curve, a, b, k, Math.sin, 1, a),
        evalTerm: (k, x, a, b) => Math.sin((k * Math.PI * (x - a)) / (b - a)),
      },
    ],
  },

  chebyshev: {
    id: "chebyshev",
    computeC0: (curve, a, b) => computeChebyshevCoef(curve, a, b, 0),
    evalC0: (c0) => c0,
    families: [
      {
        id: "T",
        coefPrefix: "T",
        computeCoef: (curve, a, b, k) => computeChebyshevCoef(curve, a, b, k),
        evalTerm: (k, x, a, b) => evalChebyshevTerm(k, x, a, b),
      },
    ],
  },
};

// ============================================================================
// Public API
// ============================================================================

/**
 * Compute all Fourier coefficients up to maxK for a given system
 * Returns: { type, c0, families: [{id, coefs: []}], domain: [a, b] }
 */
export function computeFourierCoefs(curve, a, b, maxK, systemId) {
  const system = SYSTEMS[systemId];

  return {
    type: systemId,
    c0: system.computeC0(curve, a, b),
    families: system.families.map((fam) => ({
      id: fam.id,
      coefs: Array.from({ length: maxK }, (_, i) =>
        fam.computeCoef(curve, a, b, i + 1),
      ),
    })),
    domain: [a, b],
  };
}

/**
 * Create a function that evaluates the Fourier approximation
 */
export function fourierApprox(coefs) {
  const system = SYSTEMS[coefs.type];
  const [a, b] = coefs.domain;

  return function (x) {
    let y = system.evalC0(coefs.c0);

    coefs.families.forEach((fam, fi) => {
      const famDef = system.families[fi];
      fam.coefs.forEach((c, k) => {
        y += c * famDef.evalTerm(k + 1, x, a, b);
      });
    });

    return y;
  };
}

/**
 * Get the system definition by ID
 */
export function getSystem(systemId) {
  return SYSTEMS[systemId];
}
