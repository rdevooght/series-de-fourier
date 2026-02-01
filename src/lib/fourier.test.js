import { describe, it, expect } from "vitest";
import { integrate, computeFourierCoefs, sampleFunction } from "./fourier";

const EPSILON = 1e-4;
function compare(a, b) {
  expect(Math.abs(a - b)).toBeLessThan(EPSILON);
}

describe("integrate", () => {
  it("should integrate a constant function correctly", () => {
    // f(x) = 1 from 0 to 1
    const points = [
      [0, 1],
      [1, 1],
    ];
    const result = integrate(points, 0, 1);
    compare(result, 1);
  });

  it("should integrate f(x) = x correctly", () => {
    // f(x) = x from 0 to 1
    const points = sampleFunction((x) => x, 0, 1, 1000);
    const result = integrate(points, 0, 1);
    // Analytical: 0.5
    compare(result, 0.5);
  });

  it("should integrate f(x) = x^2 correctly", () => {
    // f(x) = x^2 from 0 to 1
    const points = sampleFunction((x) => x * x, 0, 1, 1000);
    const result = integrate(points, 0, 1);
    // Analytical: 1/3
    compare(result, 1 / 3);
  });

  it("should integrate f(x) = sin(x) correctly", () => {
    // f(x) = sin(x) from 0 to PI
    const points = sampleFunction(Math.sin, 0, Math.PI, 1000);
    const result = integrate(points, 0, Math.PI);
    // Analytical: 2
    compare(result, 2);
  });
});

describe("computeFourierCoefs", () => {
  // Helper to get coef by id (a, b) and index k
  // Note: fourier.js returns 1-based arrays for k=1..maxK
  const getCoef = (result, familyId, k) => {
    const family = result.families.find((f) => f.id === familyId);
    // k is 1-based index (e.g. a_1, b_1), so we access index k-1
    return family.coefs[k - 1];
  };

  describe("Standard System ([-PI, PI])", () => {
    const a = -Math.PI;
    const b = Math.PI;

    it("should compute coefs for f(x) = sin(x)", () => {
      const points = sampleFunction(Math.sin, a, b, 1000);
      const result = computeFourierCoefs(points, a, b, 5, "standard");

      // b1 should be 1, all others 0
      // The 'standard' system maps [a, b] to [0, 2PI] via theta = 2*pi*(x-a)/(b-a).
      // On [-PI, PI], this means theta = x + PI.
      // sin(theta) = sin(x + PI) = -sin(x).
      // So the basis is -sin(x). The coefficient for sin(x) will be -1.
      compare(result.c0, 0); // a0 = 0
      compare(getCoef(result, "sin", 1), -1); // b1 = -1
      compare(getCoef(result, "cos", 1), 0); // a1 = 0
      compare(getCoef(result, "sin", 2), 0); // b2 = 0
    });

    it("should compute coefs for f(x) = cos(x)", () => {
      const points = sampleFunction(Math.cos, a, b, 1000);
      const result = computeFourierCoefs(points, a, b, 5, "standard");

      // cos(theta) = cos(x + PI) = -cos(x).
      // So the basis is -cos(x). Coefficient for cos(x) is -1.
      compare(result.c0, 0); // a0 = 0
      compare(getCoef(result, "sin", 1), 0); // b1 = 0
      compare(getCoef(result, "cos", 1), -1); // a1 = -1
    });

    it("should compute coefs for f(x) = x (Sawtooth)", () => {
      const points = sampleFunction((x) => x, a, b, 2000);
      const result = computeFourierCoefs(points, a, b, 5, "standard");

      // Basis is (-1)^n sin(nx).
      // Canonical b_n = 2 * (-1)^(n+1) / n.
      // Library B_n = (-1)^n * b_n = 2 * (-1)^(2n+1) / n = -2/n.

      compare(result.c0, 0);
      compare(getCoef(result, "cos", 1), 0);
      compare(getCoef(result, "cos", 2), 0);
      compare(getCoef(result, "cos", 3), 0);

      compare(getCoef(result, "sin", 1), -2);
      compare(getCoef(result, "sin", 2), -1);
      compare(getCoef(result, "sin", 3), -2 / 3);
    });

    it("should compute coefs for f(x) = step(x)", () => {
      // Step function: -1 for x<0, 1 for x>0.
      // On [-PI, PI], this is sign(x).
      // Canonical b_n = 4/(n*PI) for odd n, 0 for even n.
      // Library B_n = (-1)^n * b_n.
      // For odd n, (-1)^n = -1. So B_n = -4/(n*PI).

      const points = sampleFunction((x) => (x >= 0 ? 1 : -1), a, b, 2000);
      const result = computeFourierCoefs(points, a, b, 5, "standard");

      const expectedB1 = -4 / Math.PI;
      const expectedB3 = -4 / (3 * Math.PI);

      compare(getCoef(result, "sin", 1), expectedB1);
      compare(getCoef(result, "sin", 2), 0);
      compare(getCoef(result, "sin", 3), expectedB3);
    });

    it("should compute coefs for f(x) = exp(x)", () => {
      const points = sampleFunction(Math.exp, a, b, 1000);
      const result = computeFourierCoefs(points, a, b, 5, "standard");

      // Canonical a_n = 2 * (-1)^n * sinh(PI) / (PI * (1+n^2))
      // Canonical b_n = 2 * (-1)^(n+1) * n * sinh(PI) / (PI * (1+n^2))
      // Library A_n = (-1)^n * a_n.
      // Library B_n = (-1)^n * b_n.
      // So for odd n, Library Coefs should be negative of canonical Coefs.
      // For even n, they match.

      const sinhPi = Math.sinh(Math.PI);
      const factor = (2 * sinhPi) / Math.PI;

      const calcCanonicalA = (n) => (factor * Math.pow(-1, n)) / (1 + n * n);
      const calcCanonicalB = (n) =>
        (factor * Math.pow(-1, n + 1) * n) / (1 + n * n);

      // Check n=1 (Odd) -> A_1 = -a_1, B_1 = -b_1
      compare(getCoef(result, "cos", 1), -calcCanonicalA(1));
      compare(getCoef(result, "sin", 1), -calcCanonicalB(1));

      // Check n=2 (Even) -> A_2 = a_2, B_2 = b_2
      compare(getCoef(result, "cos", 2), calcCanonicalA(2));
      compare(getCoef(result, "sin", 2), calcCanonicalB(2));
    });
  });

  describe("COS System ([0, PI])", () => {
    const a = 0;
    const b = Math.PI;

    it("should compute coefs for f(x) = cos(x)", () => {
      const points = sampleFunction(Math.cos, a, b, 1000);
      const result = computeFourierCoefs(points, a, b, 5, "cos");

      // a1 = 1
      compare(getCoef(result, "cos", 1), 1);
      compare(getCoef(result, "cos", 2), 0);
    });
  });

  describe("SIN System ([0, PI])", () => {
    const a = 0;
    const b = Math.PI;

    it("should compute coefs for f(x) = sin(x)", () => {
      const points = sampleFunction(Math.sin, a, b, 1000);
      const result = computeFourierCoefs(points, a, b, 5, "sin");

      // b1 = 1
      compare(getCoef(result, "sin", 1), 1);
      compare(getCoef(result, "sin", 2), 0);
    });
  });

  describe("Chebyshev System ([-1, 1])", () => {
    const a = -1;
    const b = 1;

    // Chebyshev polynomials: T0=1, T1=x, T2=2x^2-1

    it("should compute coefs for f(x) = 1 (T0)", () => {
      const points = sampleFunction((x) => 1, a, b, 1000);
      const result = computeFourierCoefs(points, a, b, 5, "chebyshev");

      // c0 should be 1 (Note: computeC0 returns the coefficient itself)
      compare(result.c0, 1);
      compare(getCoef(result, "T", 1), 0);
    });

    it("should compute coefs for f(x) = x (T1)", () => {
      const points = sampleFunction((x) => x, a, b, 1000);
      const result = computeFourierCoefs(points, a, b, 5, "chebyshev");

      compare(result.c0, 0);
      compare(getCoef(result, "T", 1), 1); // T1 = x
      compare(getCoef(result, "T", 2), 0);
    });

    it("should compute coefs for f(x) = 2x^2 - 1 (T2)", () => {
      const points = sampleFunction((x) => 2 * x * x - 1, a, b, 1000);
      const result = computeFourierCoefs(points, a, b, 5, "chebyshev");

      compare(result.c0, 0);
      compare(getCoef(result, "T", 1), 0);
      compare(getCoef(result, "T", 2), 1); // T2
    });
  });
});
