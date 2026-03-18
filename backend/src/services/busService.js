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

const advanceBus = (bus, now = new Date()) => {
  const nextDirection = bus.lat > 12.978 || bus.lat < 12.965 ? bus.direction * -1 : bus.direction;
  const nextDelay = clamp(bus.delayMinutes + (bus.busId.endsWith("1") ? 1 : -1), 0, 18);
  const status = nextDelay > 5 ? "delayed" : "on_time";

  return {
    ...bus,
    direction: nextDirection,
    lat: Number((bus.lat + 0.0009 * nextDirection).toFixed(6)),
    lng: Number((bus.lng + 0.0007 * nextDirection).toFixed(6)),
    etaMinutes: clamp(bus.etaMinutes + (status === "delayed" ? 1 : -1), 2, 30),
    speedKph: clamp(bus.speedKph + (status === "delayed" ? -2 : 1), 10, 35),
    delayMinutes: nextDelay,
    occupancy: clamp(bus.occupancy + (nextDirection > 0 ? 2 : -1), 5, 45),
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
  clamp,
  advanceBus,
  createBusService
};
