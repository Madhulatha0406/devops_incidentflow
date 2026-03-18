const {
  createAICorrectionService,
  detectQualityIssues,
  extractKeywords,
  normalizeTokens,
  scoreCoverage
} = require("../src/services/aiCorrectionService");

describe("aiCorrectionService", () => {
  test("normalizes and extracts keywords", () => {
    expect(normalizeTokens("Campus network security!")).toEqual(["campus", "network", "security"]);
    expect(extractKeywords("network network secure secure")).toEqual(["network", "secure"]);
  });

  test("scores rubric coverage", () => {
    expect(scoreCoverage(["network", "safety"], ["network", "design"])).toBe(50);
  });

  test("detects answer quality issues", () => {
    const issues = detectQualityIssues("Short answer");
    expect(issues.length).toBeGreaterThan(0);
  });

  test("analyzes an answer", () => {
    const service = createAICorrectionService();
    const result = service.analyzeAnswer({
      question: "Explain campus network resilience",
      answer: "Campus resilience means backup links because services must remain available.",
      rubric: "Explain backup links, failover, monitoring, and service availability."
    });

    expect(result).toHaveProperty("score");
    expect(result).toHaveProperty("suggestions");
  });
});
