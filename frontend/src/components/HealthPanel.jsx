import React from "react";
import { FeatureBadge } from "./FeatureBadge";

export function HealthPanel({ health }) {
  return (
    <section className="rail-section">
      <div className="rail-section__header">
        <p className="eyebrow">System</p>
        <h2>Platform Status</h2>
        <p>Live status for the platform, database mode, and deployment color.</p>
      </div>
      {health ? (
        <div className="stack gap-md">
          <div className="rail-list">
            <div className="rail-list__row">
              <span>System</span>
              <strong>{health.status}</strong>
            </div>
            <div className="rail-list__row">
              <span>Database</span>
              <strong>{health.databaseMode}</strong>
            </div>
            <div className="rail-list__row">
              <span>Deployment</span>
              <strong>{health.activeColor}</strong>
            </div>
            <div className="rail-list__row">
              <span>Incident desk</span>
              <FeatureBadge enabled={health.featureFlags?.incidents ?? true} />
            </div>
          </div>
          <p className="section-note">
            This reads the public <code>/health</code> endpoint used by monitoring and deployment checks.
          </p>
        </div>
      ) : (
        <p className="muted">Waiting for the health endpoint to respond.</p>
      )}
    </section>
  );
}
