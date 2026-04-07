const DEFAULT_BUSES = [
  {
    busId: "BUS-101",
    name: "North Campus Loop",
    routeName: "Hostel -> Main Block",
    lat: 12.9716,
    lng: 77.5946,
    speedKph: 24,
    etaMinutes: 12,
    delayMinutes: 0,
    occupancy: 28,
    status: "on_time",
    direction: 1
  },
  {
    busId: "BUS-202",
    name: "South Campus Express",
    routeName: "Library -> Sports Complex",
    lat: 12.9681,
    lng: 77.6012,
    speedKph: 21,
    etaMinutes: 9,
    delayMinutes: 3,
    occupancy: 19,
    status: "on_time",
    direction: -1
  }
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const asNumber = (value, fallback) => (Number.isFinite(Number(value)) ? Number(value) : fallback);

const advanceBus = (bus, now = new Date()) => {
  const currentDirection = asNumber(bus.direction, 1) || 1;
  const currentLat = asNumber(bus.lat, 12.9716);
  const currentLng = asNumber(bus.lng, 77.5946);
  const currentDelay = asNumber(bus.delayMinutes, 0);
  const currentEta = asNumber(bus.etaMinutes, 12);
  const currentSpeed = asNumber(bus.speedKph, 20);
  const currentOccupancy = asNumber(bus.occupancy, 20);
  const nextDirection = currentLat > 12.978 || currentLat < 12.965 ? currentDirection * -1 : currentDirection;
  const nextDelay = clamp(currentDelay + (bus.busId.endsWith("1") ? 1 : -1), 0, 18);
  const status = nextDelay > 5 ? "delayed" : "on_time";

  return {
    ...bus,
    direction: nextDirection,
    lat: Number((currentLat + 0.0009 * nextDirection).toFixed(6)),
    lng: Number((currentLng + 0.0007 * nextDirection).toFixed(6)),
    etaMinutes: clamp(currentEta + (status === "delayed" ? 1 : -1), 2, 30),
    speedKph: clamp(currentSpeed + (status === "delayed" ? -2 : 1), 10, 35),
    delayMinutes: nextDelay,
    occupancy: clamp(currentOccupancy + (nextDirection > 0 ? 2 : -1), 5, 45),
    status,
    lastUpdated: now.toISOString()
  };
};

const createBusService = ({ repositories, nowProvider = () => new Date(), initialBuses = DEFAULT_BUSES }) => ({
  bootstrap: async () => {
    const existing = await repositories.buses.listAll();
    if (existing.length > 0) {
      return existing;
    }

    return repositories.buses.saveAll(
      initialBuses.map((bus) => ({
        ...bus,
        lastUpdated: nowProvider().toISOString()
      }))
    );
  },
  getBuses: async () => repositories.buses.listAll(),
  advanceSimulation: async () => {
    const current = await repositories.buses.listAll();
    const next = current.map((bus) => advanceBus(bus, nowProvider()));
    return repositories.buses.saveAll(next);
  },
  getDelayAlerts: async () => {
    const buses = await repositories.buses.listAll();
    return buses
      .filter((bus) => bus.delayMinutes > 5)
      .map((bus) => ({
        busId: bus.busId,
        message: `${bus.name} is delayed by ${bus.delayMinutes} minutes`,
        delayMinutes: bus.delayMinutes
      }));
  }
});

module.exports = {
  DEFAULT_BUSES,
  asNumber,
  clamp,
  advanceBus,
  createBusService
};
