import React, { useState } from "react";
import { demoCredentials, titleCase } from "./appConstants";

export function LoginPanel({ onQuickLogin, onManualLogin, loading, error }) {
  const [form, setForm] = useState({
    email: demoCredentials.student.email,
    password: demoCredentials.student.password
  });

  return (
    <section className="rail-section rail-section--spacious">
      <div className="rail-section__header">
        <p className="eyebrow">Access</p>
        <h2>Access Portal</h2>
        <p>Use a seeded role for a fast walkthrough, or sign in manually.</p>
      </div>
      <div className="stack gap-md">
        <div className="stack gap-sm quick-login-list">
          {Object.entries(demoCredentials).map(([role, credentials]) => (
            <button key={role} className="ghost-button quick-login-button" disabled={loading} onClick={() => onQuickLogin(role)}>
              <strong>{titleCase(role)}</strong>
              <span>{credentials.email}</span>
            </button>
          ))}
        </div>
        <div className="form-surface">
          <div className="grid grid-2">
            <input
              placeholder="Email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
            <input
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            />
          </div>
          <button className="primary-button" disabled={loading} onClick={() => onManualLogin(form)}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
          {error ? <p className="error-text">{error}</p> : null}
        </div>
      </div>
    </section>
  );
}
