const { AppError } = require("../utils/appError");
const { buildEscalationState, calculateSlaDueAt, isBreached } = require("../utils/sla");

const TECHNICIAN_ALLOWED_STATUSES = ["in_progress", "closed"];
const ADMIN_FINAL_STATUSES = ["resolved", "completed"];

const createActivityEntry = (actor, message, createdAt) => ({
  actorId: actor?._id || "system",
  actorRole: actor?.role || "system",
  message,
  createdAt
});

const createIncidentService = ({ repositories, slaHours, nowProvider = () => new Date() }) => ({
  reportIncident: async (payload, reporter) => {
    const createdAt = nowProvider().toISOString();
    const priority = payload.priority || "medium";
    const incident = await repositories.incidents.create({
      title: payload.title,
      description: payload.description,
      category: payload.category || "General",
      priority,
      status: "open",
      reporterId: String(reporter._id),
      technicianId: null,
      slaDueAt: calculateSlaDueAt(createdAt, priority, slaHours).toISOString(),
      escalated: false,
      escalationLevel: 0,
      resolutionSummary: "",
      activityLog: [createActivityEntry(reporter, "Incident reported", createdAt)]
    });

    return incident;
  },
  getIncidentsForUser: async (user) => {
    if (user.role === "admin") {
      return repositories.incidents.list();
    }

    if (user.role === "technician") {
      return repositories.incidents.list({ technicianId: user._id });
    }

    return repositories.incidents.list({ reporterId: user._id });
  },
  assignTechnician: async (incidentId, technicianId, adminUser) => {
    const incident = await repositories.incidents.findById(incidentId);
    const technician = await repositories.users.findById(technicianId);

    if (!incident) {
      throw new AppError("Incident not found", 404);
    }

    if (!technician || technician.role !== "technician") {
      throw new AppError("Technician not found", 404);
    }

    return repositories.incidents.update(incidentId, {
      technicianId: String(technician._id),
      status: incident.status === "open" ? "assigned" : incident.status,
      activityLog: [
        ...(incident.activityLog || []),
        createActivityEntry(adminUser, `Technician assigned: ${technician.name}`, nowProvider().toISOString())
      ]
    });
  },
  updateStatus: async (incidentId, updates, actor) => {
    const incident = await repositories.incidents.findById(incidentId);

    if (!incident) {
      throw new AppError("Incident not found", 404);
    }

    if (actor.role === "technician" && String(incident.technicianId) !== String(actor._id)) {
      throw new AppError("Technician is not assigned to this incident", 403);
    }

    const nextStatus = updates.status || incident.status;

    if (actor.role === "technician" && !TECHNICIAN_ALLOWED_STATUSES.includes(nextStatus)) {
      throw new AppError("Technician can only move incidents to in progress or closed", 403);
    }

    if (actor.role === "admin") {
      if (!ADMIN_FINAL_STATUSES.includes(nextStatus)) {
        throw new AppError("Admin can only mark incidents as resolved or completed", 403);
      }

      if (incident.status !== "closed") {
        throw new AppError("Admin can finalize incidents only after technician closure", 409);
      }
    }

    const activityMessage = `Status updated to ${nextStatus}`;

    return repositories.incidents.update(incidentId, {
      status: nextStatus,
      resolutionSummary: updates.resolutionSummary || incident.resolutionSummary,
      activityLog: [
        ...(incident.activityLog || []),
        createActivityEntry(actor, activityMessage, nowProvider().toISOString())
      ]
    });
  },
  runEscalationScan: async () => {
    const incidents = await repositories.incidents.list();
    const escalatedIncidents = [];

    for (const incident of incidents) {
      const escalationState = buildEscalationState(incident, nowProvider());
      if (!escalationState.breached) {
        continue;
      }

      const updated = await repositories.incidents.update(incident._id, {
        escalated: escalationState.escalated,
        escalationLevel: escalationState.escalationLevel,
        activityLog: [
          ...(incident.activityLog || []),
          createActivityEntry(null, escalationState.escalationReason, nowProvider().toISOString())
        ]
      });

      escalatedIncidents.push(updated);
    }

    return escalatedIncidents;
  },
  getDashboardSummary: async () => {
    const incidents = await repositories.incidents.list();

    return incidents.reduce(
      (summary, incident) => {
        summary.total += 1;
        summary.byStatus[incident.status] = (summary.byStatus[incident.status] || 0) + 1;
        if (isBreached(incident, nowProvider())) {
          summary.breached += 1;
        }
        if (incident.escalated) {
          summary.escalated += 1;
        }
        return summary;
      },
      {
        total: 0,
        breached: 0,
        escalated: 0,
        byStatus: {}
      }
    );
  }
});

module.exports = {
  createIncidentService,
  createActivityEntry,
  ADMIN_FINAL_STATUSES,
  TECHNICIAN_ALLOWED_STATUSES
};
