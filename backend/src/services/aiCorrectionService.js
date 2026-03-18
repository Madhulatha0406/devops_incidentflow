const { AppError } = require("../utils/appError");

const normalizeTokens = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 3);

const extractKeywords = (text) => [...new Set(normalizeTokens(text))];

const scoreCoverage = (answerKeywords, rubricKeywords) => {
  if (rubricKeywords.length === 0) {
    return 0;
  }

  const overlap = rubricKeywords.filter((keyword) => answerKeywords.includes(keyword)).length;
  return Math.round((overlap / rubricKeywords.length) * 100);
};

const detectQualityIssues = (answer) => {
  const issues = [];
  const trimmed = String(answer || "").trim();

  if (trimmed.length < 60) {
    issues.push("Expand the answer with more explanation and examples.");
  }

  if (!/[.?!]$/.test(trimmed)) {
    issues.push("End the answer with proper punctuation.");
  }

  if (!/\btherefore\b|\bbecause\b|\bfor example\b/i.test(trimmed)) {
    issues.push("Add reasoning words such as 'because' or 'therefore' to improve clarity.");
  }

  return issues;
};

const createAICorrectionService = ({ provider = "local" } = {}) => ({
  analyzeAnswer: ({ question, answer, rubric }) => {
    if (!answer || !rubric) {
      throw new AppError("Both answer and rubric are required", 400);
    }

    const answerKeywords = extractKeywords(answer);
    const rubricKeywords = extractKeywords(`${question || ""} ${rubric}`);
    const coverage = scoreCoverage(answerKeywords, rubricKeywords);
    const qualityIssues = detectQualityIssues(answer);
    const strengths = answerKeywords.filter((keyword) => rubricKeywords.includes(keyword)).slice(0, 5);
    const missingConcepts = rubricKeywords.filter((keyword) => !answerKeywords.includes(keyword)).slice(0, 5);

    return {
      provider,
      score: Math.round(coverage * 0.7 + Math.max(0, 30 - qualityIssues.length * 8)),
      coverage,
      strengths,
      missingConcepts,
      suggestions: [...qualityIssues, ...missingConcepts.map((concept) => `Add a point about: ${concept}.`)],
      verdict: coverage >= 70 ? "Strong answer" : "Needs improvement"
    };
  }
});

module.exports = {
  normalizeTokens,
  extractKeywords,
  scoreCoverage,
  detectQualityIssues,
  createAICorrectionService
};
