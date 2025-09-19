import { getAccessibleTextColor } from "../../src/utils/dom";

describe("getAccessibleTextColor", () => {
  it("should return black when the contrast ratio is greater than 3.5", async () => {
    const result = await getAccessibleTextColor("#000000");
    expect(result.color).toBe("#000000");
    expect(result.contrast).toBeGreaterThanOrEqual(3.5);
    expect(result.meetsAA).toBe(true);
  });

  it("should return white when the contrast ratio is greater than 3.5", async () => {
    const result = await getAccessibleTextColor("#ffffff");
    expect(result.color).toBe("#ffffff");
    expect(result.contrast).toBeGreaterThanOrEqual(3.5);
    expect(result.meetsAA).toBe(true);
  });

  it("should return a generated color when the contrast ratio is less than 3.5", async () => {
    const result = await getAccessibleTextColor("#ff0000");
    expect(result.color).toMatch(/^#([0-9A-F]{2}){3}$/i);
    expect(result.contrast).toBeLessThan(3.5);
    expect(result.meetsAA).toBe(false);
  });

  it("should handle invalid color input", async () => {
    const result = await getAccessibleTextColor("invalid");
    expect(result.color).toBe("#000000");
    expect(result.contrast).toBe(21);
    expect(result.meetsAA).toBe(true);
  });

  it("should handle transparency", async () => {
    const result = await getAccessibleTextColor("rgba(0,0,0,0.5)");
    expect(result.color).toBe("#000000");
    expect(result.contrast).toBeGreaterThanOrEqual(3.5);
    expect(result.meetsAA).toBe(true);
  });
});
