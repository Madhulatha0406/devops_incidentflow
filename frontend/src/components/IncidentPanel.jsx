import React, { useEffect, useState } from "react";
import { ModuleCard } from "./ModuleCard";
import { formatDateTime, titleCase } from "./appConstants";

function IncidentRow({ incident, role, currentUserId, technicians, onAssign, onUpdateStatus, actionBusy }) {
  const [technicianId, setTechnicianId] = useState(incident.technicianId || "");
  const [status, setStatus] = useState(incident.status);
  const [resolutionSummary, setResolutionSummary] = useState(incident.resolutionSummary || "");
  const isAssignedTechnician = role === "technician" && incident.technicianId === currentUserId;

  useEffect(() => {
    setTechnicianId(incident.technicianId || "");
    setStatus(incident.status);
    setResolutionSummary(incident.resolutionSummary || "");
  }, [incident]);

  return (
    <article className="incident-item">
      <div className="incident-item__top">
        <div>
          <strong>{incident.title}</strong>
          <p className="muted">
            {incident.category} | Priority {titleCase(incident.priority)}
          </p>
        </div>
        <div className="stack gap-sm incident-item__badges">
          <span className={`pill pill-${incident.status}`}>{titleCase(incident.status)}</span>
          {incident.escalated ? <span className="pill pill-open">Escalated</span> : null}
        </div>
      </div>

      <p>{incident.description}</p>

      <div className="incident-meta">
        <span>SLA due: {formatDateTime(incident.slaDueAt)}</span>
        <span>Technician ID: {incident.technicianId || "Unassigned"}</span>
        <span>Escalation level: {incident.escalationLevel || 0}</span>
      </div>

      {role === "admin" && technicians.length > 0 ? (
        <div className="stack gap-sm admin-action-box">
          <strong>Assign technician</strong>
          <div className="grid grid-2">
            <select value={technicianId} onChange={(event) => setTechnicianId(event.target.value)}>
              <option value="">Choose technician</option>
              {technicians.map((technician) => (
                <option key={technician._id} value={technician._id}>
                  {technician.name}
                </option>
              ))}
            </select>
            <button className="primary-button" disabled={!technicianId || actionBusy} onClick={() => onAssign(incident._id, technicianId)}>
              Assign
            </button>
          </div>
        </div>
      ) : null}

      {((role === "admin" && incident.status === "closed") || isAssignedTechnician) && incident.status !== "completed" ? (
        <div className="stack gap-sm admin-action-box">
          <strong>{role === "admin" ? "Final admin approval" : "Technician update"}</strong>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            {(role === "admin"
              ? ["resolved", "completed"]
              : ["in_progress", "closed"]
            ).map((statusOption) => (
              <option key={statusOption} value={statusOption}>
                {titleCase(statusOption)}
              </option>
            ))}
          </select>
          <textarea
            rows="3"
            placeholder="Resolution summary or technician update"
            value={resolutionSummary}
            onChange={(event) => setResolutionSummary(event.target.value)}
          />
          <button className="primary-button" disabled={actionBusy} onClick={() => onUpdateStatus(incident._id, status, resolutionSummary)}>
            Save update
          </button>
        </div>
      ) : null}

      {role === "admin" && incident.status !== "closed" ? (
        <p className="muted">Admin final approval becomes available after the technician marks the incident closed.</p>
      ) : null}

      {role === "technician" && !isAssignedTechnician ? (
        <p className="muted">This technician view only allows updates on incidents assigned to your account.</p>
      ) : null}

      {(incident.activityLog || []).length > 0 ? (
        <div className="timeline">
          <strong>Recent activity</strong>
          <ul>
            {(incident.activityLog || []).slice(-3).reverse().map((entry) => (
              <li key={`${entry.actorId}-${entry.createdAt}-${entry.message}`}>
                <span>{entry.message}</span>
                <small>{formatDateTime(entry.createdAt)}</small>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

export function IncidentPanel({ session, featureEnabled, incidents, technicians, onCreateIncident, onAssign, onUpdateStatus, actionBusy }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "General",
    priority: "medium"
  });
  const [showHistory, setShowHistory] = useState(false);

  if (!featureEnabled) {
    return (
      <ModuleCard title="Incident Desk" subtitle="This module is disabled by feature toggle.">
        <p className="muted">Enable the incidents feature from the admin panel to resume SLA ticket operations.</p>
      </ModuleCard>
    );
  }

  if (!session) {
    return (
      <ModuleCard title="Incident Desk" subtitle="Students report issues here and administrators assign technicians.">
        <p className="muted">Log in to report an issue, view previous issues, or update an SLA-driven ticket.</p>
      </ModuleCard>
    );
  }

  const canCreate = session.user.role === "student";
  const subtitle = canCreate
    ? "Report issues, track SLA deadlines, and move tickets from assignment to final approval."
    : "Review assigned or managed incidents, track SLA deadlines, and update ticket progress.";

  return (
    <ModuleCard title="Incident Desk" subtitle={subtitle}>
      {canCreate ? (
        <div className="stack gap-sm incident-form">
          <input
            placeholder="Incident title"
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          />
          <textarea
            placeholder="Describe the issue"
            rows="4"
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          />
          <div className="grid grid-2">
            <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}>
              <option>General</option>
              <option>Classroom IT</option>
              <option>Network</option>
              <option>Transport</option>
              <option>Infrastructure</option>
            </select>
            <select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <button
            className="primary-button"
            disabled={actionBusy}
            onClick={() => {
              onCreateIncident(form);
              setForm({
                title: "",
                description: "",
                category: "General",
                priority: "medium"
              });
            }}
          >
            Report incident
          </button>
        </div>
      ) : null}

      <div className="panel-toolbar list-space">
        <button className="ghost-button" onClick={() => setShowHistory((current) => !current)}>
          {showHistory ? "Hide previous issues" : "Show previous issues"}
        </button>
      </div>

      {showHistory ? (
        <div className="stack gap-sm list-space incident-list">
          {incidents.length === 0 ? <p className="muted">No incidents found for this role yet.</p> : null}
          {incidents.map((incident) => (
            <IncidentRow
              key={incident._id}
              incident={incident}
              role={session.user.role}
              currentUserId={session.user._id}
              technicians={technicians}
              onAssign={onAssign}
              onUpdateStatus={onUpdateStatus}
              actionBusy={actionBusy}
            />
          ))}
        </div>
      ) : null}
    </ModuleCard>
  );
}
