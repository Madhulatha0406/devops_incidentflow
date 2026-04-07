const mongoose = require("mongoose");

const busStateSchema = new mongoose.Schema(
  {
    busId: {
      type: String,
      required: true,
      unique: true
    },
    name: String,
    routeName: String,
    lat: Number,
    lng: Number,
    speedKph: Number,
    etaMinutes: Number,
    delayMinutes: Number,
    occupancy: Number,
    direction: {
      type: Number,
      default: 1
    },
    status: String,
    lastUpdated: Date
  },
  {
    timestamps: true
  }
);

const BusState = mongoose.models.BusState || mongoose.model("BusState", busStateSchema);

module.exports = {
  BusState
};
