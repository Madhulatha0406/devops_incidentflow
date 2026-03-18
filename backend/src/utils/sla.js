const getPriorityHours = (priority, slaHours) => slaHours[String(priority || "low").toLowerCase()] || slaHours.low;

const calculateSlaDueAt = (createdAt, priority, slaHours) => {
  const hours = getPriorityHours(priority, slaHours);
  return new Date(new Date(createdAt).getTime() + hours * 60 * 60 * 1000);
};

const isBreached = (incident, now = new Date()) => {
  if (!incident || !incident.slaDueAt) {
    return false;
  }

  return !["resolved", "closed"].includes(incident.status) && new Date(incident.slaDueAt) < new Date(now);
};

const buildEscalationState = (incident, now = new Date()) => {
  if (!isBreached(incident, now)) {
    return {
      breached: false,
      escalationLevel: incident.escalationLevel || 0,
      escalated: Boolean(incident.escalated)
    };
  }

  return {
    breached: true,
    escalated: true,
    escalationLevel: (incident.escalationLevel || 0) + 1,
    escalationReason: `SLA breached for incident ${incident.title || incident._id}`
  };
};

module.exports = {
  getPriorityHours,
  calculateSlaDueAt,
  isBreached,
  buildEscalationState
};
