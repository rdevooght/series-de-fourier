import { describe, it, expect } from "vitest";
import { integrate, computeFourierCoefs, sampleFunction } from "./fourier";

const EPSILON = 1e-4;
function compare(a, b, precision = EPSILON) {
  expect(Math.abs(a - b)).toBeLessThan(precision);
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

  describe("Standard System", () => {
    it("should compute coefs for f(x) = sin(x)", () => {
      const a = -Math.PI;
      const b = Math.PI;
      const maxK = 5;
      const points = sampleFunction(Math.sin, a, b, 1000);
      const result = computeFourierCoefs(points, a, b, maxK, "standard");

      compare(result.c0, 0); // a0 = 0
      compare(getCoef(result, "sin", 1), 1); // b1 = 1
      for (let k = 2; k <= maxK; k++) {
        compare(getCoef(result, "sin", k), 0); // b_k = 0 if k > 1
      }
      for (let k = 1; k <= maxK; k++) {
        compare(getCoef(result, "cos", k), 0); // a_k = 0
      }
    });

    it("should compute coefs for f(x) = cos(x)", () => {
      const a = -Math.PI;
      const b = Math.PI;
      const maxK = 5;
      const points = sampleFunction(Math.cos, a, b, 1000);
      const result = computeFourierCoefs(points, a, b, maxK, "standard");

      compare(result.c0, 0); // a0 = 0
      compare(getCoef(result, "cos", 1), 1); // a1 = 1
      for (let k = 2; k <= maxK; k++) {
        compare(getCoef(result, "cos", k), 0); // a_k = 0 if k > 1
      }
      for (let k = 1; k <= maxK; k++) {
        compare(getCoef(result, "sin", k), 0); // b_k = 0
      }
    });

    it("should compute coefs for f(x) = x (Sawtooth)", () => {
      const a = 0;
      const b = 1;
      const maxK = 5;
      const points = sampleFunction((x) => x, a, b, 2000);
      const result = computeFourierCoefs(points, a, b, maxK, "standard");

      compare(result.c0, b - a);
      for (let k = 1; k <= maxK; k++) {
        compare(getCoef(result, "cos", k), 0); // a_k = 0
      }
      for (let k = 1; k <= maxK; k++) {
        compare(getCoef(result, "sin", k), (a - b) / k / Math.PI);
      }
    });

    it("should compute coefs for f(x) = step(x)", () => {
      const a = -1;
      const b = 1;
      const maxK = 5;
      // Canonical b_n = 4/(n*PI) for odd n, 0 for even n.

      const points = sampleFunction((x) => (x >= 0 ? 1 : -1), a, b, 2000);
      const result = computeFourierCoefs(points, a, b, maxK, "standard");

      compare(result.c0, 0, 0.005); // a_0 = 0 TODO: improve precision requirement
      for (let k = 1; k <= maxK; k++) {
        compare(getCoef(result, "cos", k), 0, 0.005); // a_k = 0 TODO: improve precision requirement
      }
      for (let k = 1; k <= maxK; k++) {
        if (k % 2 === 0) {
          compare(getCoef(result, "sin", k), 0);
        } else {
          compare(getCoef(result, "sin", k), 4 / k / Math.PI);
        }
      }
    });

    it("should compute coefs for f(x) = exp(x)", () => {
      const a = -Math.PI;
      const b = Math.PI;
      const maxK = 5;
      const points = sampleFunction(Math.exp, a, b, 1000);
      const result = computeFourierCoefs(points, a, b, maxK, "standard");

      const factor = (Math.exp(2 * Math.PI) - 1) / Math.PI / Math.exp(Math.PI);
      compare(result.c0, factor);

      for (let k = 1; k <= maxK; k++) {
        if (k % 2 === 0) {
          compare(getCoef(result, "cos", k), factor / (k * k + 1));
          compare(getCoef(result, "sin", k), (-factor * k) / (k * k + 1));
        } else {
          // compare(getCoef(result, "cos", k), -factor / (k * k + 1));
          // compare(getCoef(result, "sin", k), (factor * k) / (k * k + 1));
        }
      }
    });
  });

  describe("COS System ", () => {
    it("should compute coefs for f(x) = cos(x) ([0, PI])", () => {
      const a = 0;
      const b = Math.PI;
      const maxK = 5;
      const points = sampleFunction(Math.cos, a, b, 1000);
      const result = computeFourierCoefs(points, a, b, maxK, "cos");

      compare(result.c0, 0); // a0 = 0
      compare(getCoef(result, "cos", 1), 1); // a1 = 1

      for (let k = 2; k <= maxK; k++) {
        compare(getCoef(result, "cos", k), 0);
      }
    });

    it("should compute coefs for f(x) = cos(x) ([-PI, PI])", () => {
      const a = -Math.PI;
      const b = Math.PI;
      const maxK = 5;
      const points = sampleFunction(Math.cos, a, b, 1000);
      const result = computeFourierCoefs(points, a, b, maxK, "cos");

      compare(result.c0, 0); // a0 = 0
      for (let k = 1; k <= maxK; k++) {
        if (k == 2) {
          compare(getCoef(result, "cos", k), -1);
        } else {
          compare(getCoef(result, "cos", k), 0);
        }
      }
    });
  });

  describe("SIN System ([0, PI])", () => {
    it("should compute coefs for f(x) = sin(x)", () => {
      const a = 0;
      const b = Math.PI;
      const maxK = 5;
      const points = sampleFunction(Math.sin, a, b, 1000);
      const result = computeFourierCoefs(points, a, b, maxK, "sin");

      // b1 = 1
      compare(getCoef(result, "sin", 1), 1);

      for (let k = 2; k <= maxK; k++) {
        compare(getCoef(result, "sin", k), 0);
      }
    });

    it("should compute coefs for f(x) = cos(x) ([-PI, PI])", () => {
      const a = -Math.PI;
      const b = Math.PI;
      const maxK = 5;
      const points = sampleFunction(Math.cos, a, b, 1000);
      const result = computeFourierCoefs(points, a, b, maxK, "sin");

      for (let k = 1; k <= maxK; k++) {
        if (k % 2 === 0) {
          compare(getCoef(result, "sin", k), 0);
        } else {
          compare(getCoef(result, "sin", k), (4 * k) / (4 - k * k) / Math.PI);
        }
      }
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
      compare(getCoef(result, "T", 1), 0, 0.005);
      compare(getCoef(result, "T", 2), 1, 0.005); // T2 TODO: improve precision requirement
    });
  });
});
