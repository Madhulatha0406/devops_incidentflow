const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    actorId: String,
    actorRole: String,
    message: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const incidentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      default: "General"
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium"
    },
    status: {
      type: String,
      enum: ["open", "assigned", "in_progress", "closed", "resolved", "completed"],
      default: "open"
    },
    reporterId: {
      type: String,
      required: true
    },
    technicianId: String,
    slaDueAt: Date,
    escalated: {
      type: Boolean,
      default: false
    },
    escalationLevel: {
      type: Number,
      default: 0
    },
    resolutionSummary: String,
    activityLog: [activityLogSchema]
  },
  {
    timestamps: true
  }
);

const Incident = mongoose.models.Incident || mongoose.model("Incident", incidentSchema);

module.exports = {
  Incident
};
