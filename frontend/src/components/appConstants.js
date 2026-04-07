const demoCredentials = {
  student: { email: "student@incidentflow.local", password: "Password123!" },
  technician: { email: "tech@incidentflow.local", password: "Password123!" },
  admin: { email: "admin@incidentflow.local", password: "Password123!" }
};

const roleDescriptions = {
  student: "Report campus infrastructure issues and review your previous complaints.",
  technician: "Work assigned incidents, add closure notes, and hand closed tickets to admin for final approval.",
  admin: "Assign technicians, monitor SLA risk, and finalize tickets after technician closure."
};

const defaultFeatureFlags = {
  incidents: true,
  busTracking: true,
  aiCorrection: true
};

const incidentStatuses = ["open", "assigned", "in_progress", "closed", "resolved", "completed"];

const titleCase = (value) =>
  String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : "Not available");

const formatModuleState = (enabled) => (enabled ? "Enabled" : "Disabled");

export { defaultFeatureFlags, demoCredentials, formatDateTime, formatModuleState, incidentStatuses, roleDescriptions, titleCase };
