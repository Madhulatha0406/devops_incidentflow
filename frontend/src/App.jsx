import React, { useEffect, useMemo, useState } from "react";
import { ModuleCard } from "./components/ModuleCard";
import { apiRequest } from "./api/client";
import "./styles.css";

const demoCredentials = {
  student: { email: "student@incidentflow.local", password: "Password123!" },
  technician: { email: "tech@incidentflow.local", password: "Password123!" },
  admin: { email: "admin@incidentflow.local", password: "Password123!" }
};

const formatModuleState = (enabled) => (enabled ? "Enabled" : "Disabled");

function FeatureBadge({ enabled }) {
  return <span className={`feature-badge ${enabled ? "enabled" : "disabled"}`}>{formatModuleState(enabled)}</span>;
}

function LoginPanel({ onLogin, loading, error }) {
  const [role, setRole] = useState("student");

  return (
    <ModuleCard title="Demo Access" subtitle="Choose a role to explore the campus operations workflow." accent="var(--sunset)">
      <div className="stack gap-md">
        <select value={role} onChange={(event) => setRole(event.target.value)}>
          <option value="student">Student</option>
          <option value="technician">Technician</option>
          <option value="admin">Admin</option>
        </select>
        <button disabled={loading} onClick={() => onLogin(demoCredentials[role])}>
          {loading ? "Signing in..." : `Login as ${role}`}
        </button>
        {error ? <p className="error-text">{error}</p> : null}
      </div>
    </ModuleCard>
  );
}

function IncidentPanel({ incidents, onCreateIncident, userRole }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "General",
    priority: "medium"
  });

  const canCreate = userRole === "student" || userRole === "admin";

  return (
    <ModuleCard title="Incident Desk" subtitle="SLA-based issue lifecycle with technician assignment and escalation logic.">
      {canCreate ? (
        <div className="stack gap-sm">
          <input
            placeholder="Incident title"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
          />
          <textarea
            placeholder="Describe the issue"
            rows="4"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
          <div className="grid grid-2">
            <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
              <option>General</option>
              <option>Classroom IT</option>
              <option>Network</option>
              <option>Transport</option>
            </select>
            <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <button
            onClick={() => {
              onCreateIncident(form);
              setForm({ title: "", description: "", category: "General", priority: "medium" });
            }}
          >
            Report incident
          </button>
        </div>
      ) : null}

      <div className="stack gap-sm list-space">
        {incidents.map((incident) => (
          <article key={incident._id} className="incident-item">
            <div className="incident-item__top">
              <strong>{incident.title}</strong>
              <span className={`pill pill-${incident.status}`}>{incident.status}</span>
            </div>
            <p>{incident.description}</p>
            <small>
              Priority: {incident.priority} | SLA due: {new Date(incident.slaDueAt).toLocaleString()}
            </small>
          </article>
        ))}
      </div>
    </ModuleCard>
  );
}

function BusPanel({ buses, alerts }) {
  return (
    <ModuleCard title="Smart Bus Tracking" subtitle="Live mock GPS updates with delay alerts for campus shuttles." accent="var(--ocean)">
      <div className="grid grid-2 list-space">
        {buses.map((bus) => (
          <article key={bus.busId} className="bus-card">
            <strong>{bus.name}</strong>
            <p>{bus.routeName}</p>
            <small>
              ETA {bus.etaMinutes} min | Delay {bus.delayMinutes} min | Occupancy {bus.occupancy}
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

function AIPanel({ analysis, onAnalyze }) {
  const [form, setForm] = useState({
    question: "Explain the importance of failover in campus systems.",
    answer: "",
    rubric: "Include failover, redundancy, uptime, and monitoring."
  });

  return (
    <ModuleCard title="AI Correction Coach" subtitle="Teacher support module for structured answer feedback and improvement suggestions." accent="var(--mint)">
      <div className="stack gap-sm">
        <textarea value={form.question} rows="2" onChange={(event) => setForm({ ...form, question: event.target.value })} />
        <textarea
          value={form.answer}
          rows="5"
          placeholder="Paste a student answer"
          onChange={(event) => setForm({ ...form, answer: event.target.value })}
        />
        <textarea value={form.rubric} rows="3" onChange={(event) => setForm({ ...form, rubric: event.target.value })} />
        <button onClick={() => onAnalyze(form)}>Analyze answer</button>
      </div>

      {analysis ? (
        <div className="analysis-box">
          <strong>
            {analysis.verdict} | Score {analysis.score}
          </strong>
          <p>Coverage: {analysis.coverage}%</p>
          <p>Strengths: {analysis.strengths.join(", ") || "Needs more rubric-aligned points."}</p>
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

function AdminPanel({ dashboard, onToggleFeature }) {
  const flags = dashboard?.featureFlags || {};

  return (
    <ModuleCard title="Admin Control Tower" subtitle="Operations view for SLA risk, staffing, and feature rollout control." accent="var(--rose)">
      {dashboard ? (
        <div className="stack gap-md">
          <div className="grid grid-3">
            <div className="metric">
              <span>Total incidents</span>
              <strong>{dashboard.incidents.total}</strong>
            </div>
            <div className="metric">
              <span>SLA breached</span>
              <strong>{dashboard.incidents.breached}</strong>
            </div>
            <div className="metric">
              <span>Delayed buses</span>
              <strong>{dashboard.buses.delayed}</strong>
            </div>
          </div>
          <div className="stack gap-sm">
            {Object.entries(flags).map(([name, enabled]) => (
              <div key={name} className="feature-row">
                <div>
                  <strong>{name}</strong>
                  <FeatureBadge enabled={enabled} />
                </div>
                <button onClick={() => onToggleFeature(name, !enabled)}>{enabled ? "Disable" : "Enable"}</button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="muted">Admin analytics will appear after login.</p>
      )}
    </ModuleCard>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [incidents, setIncidents] = useState([]);
  const [buses, setBuses] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [dashboard, setDashboard] = useState(null);

  const role = session?.user?.role;
  const featureFlags = dashboard?.featureFlags || {
    incidents: true,
    busTracking: true,
    aiCorrection: true
  };

  const headline = useMemo(() => {
    if (!role) {
      return "Campus operations, transport intelligence, and AI-assisted evaluation in one platform.";
    }

    return `Signed in as ${role}. Monitor campus service delivery in real time.`;
  }, [role]);

  const loadRoleData = async (token, nextRole) => {
    const tasks = [apiRequest("/incidents", { token }).then((payload) => setIncidents(payload.incidents)).catch(() => setIncidents([]))];

    tasks.push(apiRequest("/buses", { token }).then((payload) => {
      setBuses(payload.buses);
      setAlerts(payload.alerts);
    }).catch(() => {
      setBuses([]);
      setAlerts([]);
    }));

    if (nextRole === "admin") {
      tasks.push(apiRequest("/admin/dashboard", { token }).then((payload) => setDashboard(payload.dashboard)));
    }

    await Promise.all(tasks);
  };

  const handleLogin = async (credentials) => {
    try {
      setLoading(true);
      setError("");
      const result = await apiRequest("/auth/login", {
        method: "POST",
        body: credentials
      });
      setSession(result);
      await loadRoleData(result.token, result.user.role);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIncident = async (form) => {
    if (!session) {
      return;
    }

    await apiRequest("/incidents", {
      method: "POST",
      token: session.token,
      body: form
    });
    await loadRoleData(session.token, session.user.role);
  };

  const handleAnalyze = async (form) => {
    if (!session) {
      return;
    }

    const result = await apiRequest("/ai/correct", {
      method: "POST",
      token: session.token,
      body: form
    });
    setAnalysis(result.analysis);
  };

  const handleToggleFeature = async (name, enabled) => {
    if (!session) {
      return;
    }

    await apiRequest(`/admin/feature-flags/${name}`, {
      method: "PATCH",
      token: session.token,
      body: { enabled }
    });
    const refreshed = await apiRequest("/admin/dashboard", {
      token: session.token
    });
    setDashboard(refreshed.dashboard);
  };

  useEffect(() => {
    if (!session) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      loadRoleData(session.token, session.user.role).catch(() => undefined);
    }, 8000);

    return () => clearInterval(intervalId);
  }, [session]);

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero__copy">
          <p className="eyebrow">IncidentFlow+</p>
          <h1>SLA-led campus support with live shuttle intelligence.</h1>
          <p>{headline}</p>
        </div>
        <div className="hero__flags">
          <div>
            <span>Incident module</span>
            <FeatureBadge enabled={featureFlags.incidents} />
          </div>
          <div>
            <span>Bus module</span>
            <FeatureBadge enabled={featureFlags.busTracking} />
          </div>
          <div>
            <span>AI correction</span>
            <FeatureBadge enabled={featureFlags.aiCorrection} />
          </div>
        </div>
      </header>

      {!session ? <LoginPanel onLogin={handleLogin} loading={loading} error={error} /> : null}

      <main className="dashboard-grid">
        <IncidentPanel incidents={incidents} onCreateIncident={handleCreateIncident} userRole={role} />
        <BusPanel buses={buses} alerts={alerts} />
        <AIPanel analysis={analysis} onAnalyze={handleAnalyze} />
        <AdminPanel dashboard={dashboard} onToggleFeature={handleToggleFeature} />
      </main>
    </div>
  );
}
