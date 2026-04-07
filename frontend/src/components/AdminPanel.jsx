import React, { useState } from "react";
import { ModuleCard } from "./ModuleCard";
import { titleCase } from "./appConstants";

export function AdminPanel({
  session,
  dashboard,
  users,
  onCreateUser,
  onRefreshAdmin,
  onRunEscalations,
  actionBusy
}) {
  const technicianRoster = users.filter((user) => user.role === "technician");
  const supportingUsers = users.filter((user) => user.role !== "technician");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "technician",
    department: "Campus Services",
    specialty: "Electrician"
  });

  if (!session || session.user.role !== "admin") {
    return null;
  }

  return (
    <ModuleCard title="Admin Workspace" subtitle="SLA risk, people operations, and final approvals in one place." accent="var(--rose)">
      <div className="stack gap-md">
        <div className="stat-ribbon">
          <div className="stat-ribbon__item">
            <span>Total incidents</span>
            <strong>{dashboard?.incidents?.total ?? 0}</strong>
          </div>
          <div className="stat-ribbon__item">
            <span>SLA breached</span>
            <strong>{dashboard?.incidents?.breached ?? 0}</strong>
          </div>
          <div className="stat-ribbon__item">
            <span>Escalated</span>
            <strong>{dashboard?.incidents?.escalated ?? 0}</strong>
          </div>
        </div>

        <div className="panel-toolbar">
          <button className="ghost-button" disabled={actionBusy} onClick={onRefreshAdmin}>
            Refresh dashboard
          </button>
          <button className="ghost-button" disabled={actionBusy} onClick={onRunEscalations}>
            Run escalation scan
          </button>
        </div>

        <div className="admin-grid">
          <div className="admin-section">
            <h3>Create campus user</h3>
            <div className="grid grid-2">
              <input
                placeholder="Full name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
              <input
                placeholder="Email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              />
              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              />
              <select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}>
                <option value="student">Student</option>
                <option value="technician">Technician</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="grid grid-2">
              <input
                placeholder="Team or department"
                value={form.department}
                onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))}
              />
              <input
                placeholder="Specialty"
                value={form.specialty}
                onChange={(event) => setForm((current) => ({ ...current, specialty: event.target.value }))}
              />
            </div>
            <button
              className="primary-button"
              disabled={actionBusy}
              onClick={() => {
                onCreateUser(form);
                setForm({
                  name: "",
                  email: "",
                  password: "",
                  role: "technician",
                  department: "Campus Services",
                  specialty: "Electrician"
                });
              }}
            >
              Create user
            </button>
          </div>

          <div className="admin-section">
            <h3>Technician bench</h3>
            <div className="stack directory-list">
              {technicianRoster.map((user) => (
                <article key={user._id} className="user-row user-row--technician">
                  <div>
                    <strong>{user.name}</strong>
                    <p>{user.email}</p>
                  </div>
                  <div className="user-row__details">
                    <span className="session-pill">{user.specialty || "Generalist"}</span>
                    <small>{user.department}</small>
                  </div>
                </article>
              ))}
            </div>

            {supportingUsers.length > 0 ? (
              <div className="stack gap-sm">
                <h3>Support directory</h3>
                <div className="stack directory-list">
                  {supportingUsers.map((user) => (
                    <article key={user._id} className="user-row">
                      <div>
                        <strong>{user.name}</strong>
                        <p>
                          {user.email} | {titleCase(user.role)}
                        </p>
                      </div>
                      <span>{user.department}</span>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </ModuleCard>
  );
}
