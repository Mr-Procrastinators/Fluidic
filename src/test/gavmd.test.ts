import { describe, expect, it } from "vitest";
import { normalizeGAVMDResult } from "@/lib/gavmd";

describe("normalizeGAVMDResult", () => {
  it("normalizes a leak result and its calculated pressure", () => {
    expect(
      normalizeGAVMDResult({
        status: "leak",
        flow: "12.5",
        pressure_pa: "140",
        timestamp: 1711857848,
      })
    ).toEqual({
      status: "LEAK",
      location_m: 0,
      latitude: 0,
      longitude: 0,
      flow: 12.5,
      pressure_pa: 140,
      timestamp: 1711857848,
    });
  });

  it("ignores result statuses that do not indicate a detection state", () => {
    expect(normalizeGAVMDResult({ status: "TEST", flow: 10 })).toBeNull();
    expect(normalizeGAVMDResult(null)).toBeNull();
  });

  it("keeps invalid calculated pressure unavailable", () => {
    expect(normalizeGAVMDResult({ status: "NORMAL", pressure_pa: "invalid" })?.pressure_pa).toBeNull();
  });
});
