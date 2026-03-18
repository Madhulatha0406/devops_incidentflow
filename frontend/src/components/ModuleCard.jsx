import React from "react";

export function ModuleCard({ title, subtitle, children, accent = "var(--accent)" }) {
  return (
    <section className="module-card" style={{ borderColor: accent }}>
      <div className="module-card__header">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
