import React, { useEffect, useState } from "react";
import { apiRequest } from "./api/client";
import { AdminPanel } from "./components/AdminPanel";
import { IncidentPanel } from "./components/IncidentPanel";
import { LoginPanel } from "./components/LoginPanel";
import { SessionPanel } from "./components/SessionPanel";
import { demoCredentials, roleDescriptions, titleCase } from "./components/appConstants";
import "./styles.css";

const SESSION_STORAGE_KEY = "incidentflow-session";

const saveSession = (session) => {
  if (typeof window === "undefined") {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
};

const loadSavedSession = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored);
  } catch (_error) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
};

export default function App() {
  const [session, setSession] = useState(loadSavedSession);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [incidents, setIncidents] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [showAdminWorkspace, setShowAdminWorkspace] = useState(false);

  const role = session?.user?.role;
  const technicians = users.filter((user) => user.role === "technician");
  const specialistCount = technicians.length || 5;
  const headline = role
    ? `Signed in as ${titleCase(role)}. ${roleDescriptions[role]}`
    : "A quieter service desk for campus operations, with student-only intake, specialist routing, and SLA-aware follow-through.";
  const workspaceFocus = role
    ? {
        student: "Student intake",
        technician: "Technician execution",
        admin: "Administrative control"
      }[role]
    : "Demo access";

  const showSuccess = (message) => {
    setStatusMessage(message);
    setError("");
  };

  const loadHealth = async () => {
    try {
      const response = await fetch("/health");
      const payload = await response.json();
      setHealth(payload);
    } catch (_error) {
      setHealth(null);
    }
  };

  const loadRoleData = async (token, nextRole) => {
    const requests = [
      apiRequest("/incidents", { token }),
      nextRole === "admin" ? apiRequest("/admin/dashboard", { token }) : Promise.resolve(null),
      nextRole === "admin" ? apiRequest("/admin/users", { token }) : Promise.resolve(null)
    ];

    const [incidentsResult, dashboardResult, usersResult] = await Promise.allSettled(requests);

    if (incidentsResult.status === "fulfilled") {
      setIncidents(incidentsResult.value.incidents || []);
    }

    if (dashboardResult.status === "fulfilled" && dashboardResult.value) {
      setDashboard(dashboardResult.value.dashboard);
    } else if (nextRole !== "admin") {
      setDashboard(null);
    }

    if (usersResult.status === "fulfilled" && usersResult.value) {
      setUsers(usersResult.value.users || []);
    } else if (nextRole !== "admin") {
      setUsers([]);
    }
  };

  const startSession = async (credentials) => {
    try {
      setLoading(true);
      setError("");
      const result = await apiRequest("/auth/login", {
        method: "POST",
        body: credentials
      });
      setSession(result);
      saveSession(result);
      await Promise.all([loadRoleData(result.token, result.user.role), loadHealth()]);
      showSuccess(`${titleCase(result.user.role)} login successful.`);
    } catch (requestError) {
      setError(requestError.message);
      setStatusMessage("");
    } finally {
      setLoading(false);
    }
  };

  const refreshCurrentSession = async () => {
    if (!session) {
      await loadHealth();
      return;
    }

    try {
      setActionBusy(true);
      await Promise.all([loadRoleData(session.token, session.user.role), loadHealth()]);
      showSuccess("Dashboard refreshed successfully.");
    } catch (requestError) {
      setError(requestError.message);
      setStatusMessage("");
    } finally {
      setActionBusy(false);
    }
  };

  const handleLogout = () => {
    saveSession(null);
    setSession(null);
    setIncidents([]);
    setDashboard(null);
    setUsers([]);
    setShowAdminWorkspace(false);
    setError("");
    showSuccess("Session cleared.");
  };

  const runWithBusyState = async (message, action) => {
    try {
      setActionBusy(true);
      setError("");
      await action();
      if (message) {
        showSuccess(message);
      }
    } catch (requestError) {
      setError(requestError.message);
      setStatusMessage("");
    } finally {
      setActionBusy(false);
    }
  };

  const handleCreateIncident = async (form) => {
    if (!session) {
      return;
    }

    await runWithBusyState("Incident reported successfully.", async () => {
      await apiRequest("/incidents", {
        method: "POST",
        token: session.token,
        body: form
      });
      await loadRoleData(session.token, session.user.role);
    });
  };

  const handleAssignIncident = async (incidentId, technicianId) => {
    if (!session) {
      return;
    }

    await runWithBusyState("Technician assigned successfully.", async () => {
      await apiRequest(`/incidents/${incidentId}/assign`, {
        method: "PATCH",
        token: session.token,
        body: { technicianId }
      });
      await loadRoleData(session.token, session.user.role);
    });
  };

  const handleUpdateIncidentStatus = async (incidentId, status, resolutionSummary) => {
    if (!session) {
      return;
    }

    await runWithBusyState("Incident updated successfully.", async () => {
      await apiRequest(`/incidents/${incidentId}/status`, {
        method: "PATCH",
        token: session.token,
        body: { status, resolutionSummary }
      });
      await loadRoleData(session.token, session.user.role);
    });
  };

  const handleCreateUser = async (form) => {
    if (!session) {
      return;
    }

    await runWithBusyState("User created successfully.", async () => {
      await apiRequest("/admin/users", {
        method: "POST",
        token: session.token,
        body: form
      });
      await loadRoleData(session.token, session.user.role);
    });
  };

  const handleRunEscalations = async () => {
    if (!session) {
      return;
    }

    await runWithBusyState("Escalation scan completed.", async () => {
      await apiRequest("/admin/escalations/run", {
        method: "POST",
        token: session.token
      });
      await loadRoleData(session.token, session.user.role);
    });
  };

  useEffect(() => {
    loadHealth().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!session) {
      return undefined;
    }

    loadRoleData(session.token, session.user.role).catch((requestError) => {
      setError(requestError.message);
    });

    const intervalId = setInterval(() => {
      loadRoleData(session.token, session.user.role).catch(() => undefined);
      loadHealth().catch(() => undefined);
    }, 8000);

    return () => clearInterval(intervalId);
  }, [session]);

  return (
    <div className="app-shell">
      <div className="app-layout">
        <aside className="app-rail">
          <div className="rail-brand">
            <p className="eyebrow">IncidentFlow</p>
            <h2 className="rail-brand__title">Campus operations, stripped back to what matters.</h2>
            <p className="rail-brand__body">
              A compact left rail for access and session controls, with the working surface kept open for triage, assignment, and closure.
            </p>
          </div>

          {!session ? (
            <LoginPanel
              onQuickLogin={(roleName) => startSession(demoCredentials[roleName])}
              onManualLogin={startSession}
              loading={loading}
              error={error}
            />
          ) : (
            <SessionPanel
              session={session}
              onRefresh={refreshCurrentSession}
              onLogout={handleLogout}
              busy={actionBusy}
              showAdminWorkspace={showAdminWorkspace}
              onToggleAdminWorkspace={() => setShowAdminWorkspace((current) => !current)}
            />
          )}
        </aside>

        <div className="content-column">
          <header className="hero">
            <div className="hero__copy">
              <p className="eyebrow">Campus Service Desk</p>
              <h1>One calm desk for intake, routing, and resolution.</h1>
              <p>{headline}</p>
              <div className="hero__actions">
                <span className="hero-tag">Student-only reporting</span>
                <span className="hero-tag">Specialist technician routing</span>
                <span className="hero-tag">SLA breach escalation</span>
                <span className="hero-tag">CI-verified delivery</span>
              </div>
            </div>

            <div className="hero__meta">
              <p className="eyebrow">Desk Snapshot</p>
              <div className="hero-detail-list">
                <div className="hero-detail">
                  <span>Current lens</span>
                  <strong>{workspaceFocus}</strong>
                </div>
                <div className="hero-detail">
                  <span>Specialist bench</span>
                  <strong>{specialistCount} technicians</strong>
                </div>
                <div className="hero-detail">
                  <span>Escalation model</span>
                  <strong>Deadline breach plus admin follow-through</strong>
                </div>
              </div>
            </div>
          </header>

          {statusMessage ? <div className="status-banner success-banner">{statusMessage}</div> : null}
          {error ? <div className="status-banner error-banner">{error}</div> : null}

          <main className="content-stack">
            <IncidentPanel
              session={session}
              featureEnabled={health?.featureFlags?.incidents ?? true}
              incidents={incidents}
              technicians={technicians}
              onCreateIncident={handleCreateIncident}
              onAssign={handleAssignIncident}
              onUpdateStatus={handleUpdateIncidentStatus}
              actionBusy={actionBusy}
            />

            {showAdminWorkspace ? (
              <section className="admin-workspace-grid">
                <AdminPanel
                  session={session}
                  dashboard={dashboard}
                  users={users}
                  onCreateUser={handleCreateUser}
                  onRefreshAdmin={refreshCurrentSession}
                  onRunEscalations={handleRunEscalations}
                  actionBusy={actionBusy}
                />
              </section>
            ) : null}
          </main>
        </div>
      </div>
    </div>
  );
}
