import { describe, expect, it } from "vitest";
import { calculateDynamicPressurePa } from "@/lib/pressure";

describe("calculateDynamicPressurePa", () => {
  it("calculates dynamic pressure from flow using the 20 mm pipe formula", () => {
    expect(calculateDynamicPressurePa(10)).toBeCloseTo(140.7, 0);
  });

  it("returns zero pressure when there is no flow", () => {
    expect(calculateDynamicPressurePa(0)).toBe(0);
  });
});
