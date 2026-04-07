import React from "react";
import { ModuleCard } from "./ModuleCard";
import { titleCase, formatDateTime } from "./appConstants";

export function BusPanel({ session, featureEnabled, buses, alerts }) {
  if (!featureEnabled) {
    return (
      <ModuleCard title="Bus Tracking" subtitle="This module is disabled by feature toggle." accent="var(--ocean)">
        <p className="muted">Enable the bus feature to simulate GPS updates and delay alerts.</p>
      </ModuleCard>
    );
  }

  return (
    <ModuleCard title="Smart Bus Tracking" subtitle="Live mock GPS updates with delay alerts for campus shuttles." accent="var(--ocean)">
      {!session ? <p className="muted">Log in to view live shuttle ETA, occupancy, and delay notifications.</p> : null}

      <div className="grid grid-2 list-space">
        {buses.map((bus) => (
          <article key={bus.busId} className="bus-card">
            <div className="incident-item__top">
              <strong>{bus.name}</strong>
              <span className={`pill ${bus.status === "delayed" ? "pill-open" : "pill-resolved"}`}>{titleCase(bus.status)}</span>
            </div>
            <p>{bus.routeName}</p>
            <div className="incident-meta">
              <span>ETA {bus.etaMinutes} min</span>
              <span>Delay {bus.delayMinutes} min</span>
              <span>Occupancy {bus.occupancy}</span>
            </div>
            <small>
              GPS {bus.lat}, {bus.lng} | Updated {formatDateTime(bus.lastUpdated)}
            </small>
          </article>
        ))}
      </div>

      <div className="stack gap-sm list-space">
        {alerts.length === 0 ? <p className="muted">No delay alerts right now.</p> : null}
        {alerts.map((alert) => (
          <div key={alert.busId} className="alert-banner">
            {alert.message}
          </div>
        ))}
      </div>
    </ModuleCard>
  );
}
