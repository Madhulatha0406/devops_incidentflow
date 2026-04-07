import React, { useState } from "react";
import { ModuleCard } from "./ModuleCard";

export function AIPanel({ session, featureEnabled, analysis, onAnalyze }) {
  const [form, setForm] = useState({
    question: "Explain the importance of failover in campus systems.",
    answer: "",
    rubric: "Include failover, redundancy, uptime, and monitoring."
  });

  if (!featureEnabled) {
    return (
      <ModuleCard title="AI Correction Coach" subtitle="This module is disabled by feature toggle." accent="var(--mint)">
        <p className="muted">Enable the AI correction feature to demonstrate rubric-based answer feedback.</p>
      </ModuleCard>
    );
  }

  return (
    <ModuleCard
      title="AI Correction Coach"
      subtitle="Teacher support module for structured answer feedback and improvement suggestions."
      accent="var(--mint)"
    >
      {!session ? <p className="muted">Log in to analyze answers against a rubric and generate correction guidance.</p> : null}
      <div className="stack gap-sm">
        <textarea value={form.question} rows="2" onChange={(event) => setForm((current) => ({ ...current, question: event.target.value }))} />
        <textarea
          value={form.answer}
          rows="5"
          placeholder="Paste a student answer"
          onChange={(event) => setForm((current) => ({ ...current, answer: event.target.value }))}
        />
        <textarea value={form.rubric} rows="3" onChange={(event) => setForm((current) => ({ ...current, rubric: event.target.value }))} />
        <button disabled={!session} onClick={() => onAnalyze(form)}>
          Analyze answer
        </button>
      </div>

      {analysis ? (
        <div className="analysis-box">
          <strong>
            {analysis.verdict} | Score {analysis.score}
          </strong>
          <p>Coverage: {analysis.coverage}%</p>
          <p>Provider: {analysis.provider}</p>
          <p>Strengths: {analysis.strengths.join(", ") || "Needs more rubric-aligned points."}</p>
          <p>Missing concepts: {analysis.missingConcepts.join(", ") || "No major gaps detected."}</p>
          <ul>
            {analysis.suggestions.map((suggestion) => (
              <li key={suggestion}>{suggestion}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </ModuleCard>
  );
}
