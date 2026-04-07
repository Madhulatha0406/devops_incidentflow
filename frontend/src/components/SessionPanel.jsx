import React from "react";
import { titleCase } from "./appConstants";

export function SessionPanel({ session, onRefresh, onLogout, busy, showAdminWorkspace, onToggleAdminWorkspace }) {
  const isAdmin = session.user.role === "admin";

  return (
    <section className="rail-section rail-section--spacious">
      <div className="rail-section__header">
        <p className="eyebrow">Workspace</p>
        <h2>{session.user.name}</h2>
        <p>{titleCase(session.user.role)} session</p>
      </div>

      <div className="rail-list">
        <div className="rail-list__row">
          <span>Role</span>
          <span className="session-pill">{titleCase(session.user.role)}</span>
        </div>
        <div className="rail-list__row">
          <span>Email</span>
          <strong>{session.user.email}</strong>
        </div>
        <div className="rail-list__row">
          <span>Department</span>
          <strong>{session.user.department}</strong>
        </div>
      </div>

      <div className="rail-actions">
        {isAdmin ? (
          <button className="ghost-button" disabled={busy} onClick={onToggleAdminWorkspace}>
            {showAdminWorkspace ? "Hide admin workspace" : "Open admin workspace"}
          </button>
        ) : null}
        <button className="ghost-button" disabled={busy} onClick={onRefresh}>
          Refresh
        </button>
        <button className="ghost-button" onClick={onLogout}>
          Sign out
        </button>
      </div>
    </section>
  );
}
