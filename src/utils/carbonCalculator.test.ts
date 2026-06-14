import { describe, test, expect } from "vitest";
import { calculateCarbon } from "./carbonCalculator";

describe("calculateCarbon", () => {
  test("returns valid carbon values", () => {
    const result = calculateCarbon({
      transport: 10,
      electricity: 100,
      diet: 3,
      shopping: 2
    });

    expect(result.daily).toBeGreaterThan(0);
    expect(result.yearly).toBeGreaterThan(0);
  });
});
