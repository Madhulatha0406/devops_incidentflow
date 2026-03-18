const createIncidentController = ({ incidentService }) => ({
  listIncidents: async (req, res) => {
    const incidents = await incidentService.getIncidentsForUser(req.user);
    res.json({ incidents });
  },
  reportIncident: async (req, res) => {
    const incident = await incidentService.reportIncident(req.body, req.user);
    res.status(201).json({
      message: "Incident created successfully",
      incident
    });
  },
  assignTechnician: async (req, res) => {
    const incident = await incidentService.assignTechnician(req.params.id, req.body.technicianId, req.user);
    res.json({
      message: "Technician assigned successfully",
      incident
    });
  },
  updateStatus: async (req, res) => {
    const incident = await incidentService.updateStatus(req.params.id, req.body, req.user);
    res.json({
      message: "Incident updated successfully",
      incident
    });
  }
});

module.exports = {
  createIncidentController
};
