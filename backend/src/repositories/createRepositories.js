const bcrypt = require("bcryptjs");
const { User } = require("../models/User");
const { Incident } = require("../models/Incident");
const { BusState } = require("../models/BusState");

const clone = (value) => JSON.parse(JSON.stringify(value));

const buildId = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

const applyIncidentFilters = (incident, filters = {}) => {
  if (filters.reporterId && incident.reporterId !== filters.reporterId) {
    return false;
  }

  if (filters.technicianId && incident.technicianId !== filters.technicianId) {
    return false;
  }

  if (filters.status && incident.status !== filters.status) {
    return false;
  }

  return true;
};

const seedMemoryUsers = (defaultUsers) =>
  defaultUsers.map((user) => ({
    _id: buildId("usr"),
    name: user.name,
    email: user.email.toLowerCase(),
    passwordHash: bcrypt.hashSync(user.password, 10),
    role: user.role,
    department: user.department || "Campus Services",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));

const createMemoryRepositories = ({ defaultUsers = [] } = {}) => {
  const users = seedMemoryUsers(defaultUsers);
  const incidents = [];
  let busStates = [];

  return {
    mode: "memory",
    users: {
      seedDefaults: async () => clone(users),
      create: async (user) => {
        const record = {
          _id: buildId("usr"),
          ...user,
          email: user.email.toLowerCase(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        users.push(record);
        return clone(record);
      },
      findByEmail: async (email) => clone(users.find((user) => user.email === String(email).toLowerCase()) || null),
      findById: async (id) => clone(users.find((user) => user._id === id) || null),
      list: async (filters = {}) =>
        clone(users.filter((user) => (filters.role ? user.role === filters.role : true)))
    },
    incidents: {
      create: async (incident) => {
        const record = {
          _id: buildId("inc"),
          ...incident,
          createdAt: incident.createdAt || new Date().toISOString(),
          updatedAt: incident.updatedAt || new Date().toISOString()
        };
        incidents.push(record);
        return clone(record);
      },
      findById: async (id) => clone(incidents.find((incident) => incident._id === id) || null),
      list: async (filters = {}) => clone(incidents.filter((incident) => applyIncidentFilters(incident, filters))),
      update: async (id, updates) => {
        const index = incidents.findIndex((incident) => incident._id === id);
        if (index === -1) {
          return null;
        }

        incidents[index] = {
          ...incidents[index],
          ...updates,
          updatedAt: new Date().toISOString()
        };

        return clone(incidents[index]);
      }
    },
    buses: {
      listAll: async () => clone(busStates),
      saveAll: async (states) => {
        busStates = clone(states);
        return clone(busStates);
      }
    }
  };
};

const createMongoRepositories = () => ({
  mode: "mongo",
  users: {
    seedDefaults: async (defaultUsers) => {
      for (const user of defaultUsers) {
        const existing = await User.findOne({ email: user.email.toLowerCase() });
        if (!existing) {
          await User.create({
            name: user.name,
            email: user.email.toLowerCase(),
            passwordHash: bcrypt.hashSync(user.password, 10),
            role: user.role,
            department: user.department || "Campus Services"
          });
        }
      }

      return User.find().lean();
    },
    create: async (user) => (await User.create(user)).toObject(),
    findByEmail: async (email) => User.findOne({ email: String(email).toLowerCase() }).lean(),
    findById: async (id) => User.findById(id).lean(),
    list: async (filters = {}) => User.find(filters).lean()
  },
  incidents: {
    create: async (incident) => (await Incident.create(incident)).toObject(),
    findById: async (id) => Incident.findById(id).lean(),
    list: async (filters = {}) => Incident.find(filters).sort({ createdAt: -1 }).lean(),
    update: async (id, updates) =>
      Incident.findByIdAndUpdate(id, updates, {
        new: true
      }).lean()
  },
  buses: {
    listAll: async () => BusState.find().sort({ busId: 1 }).lean(),
    saveAll: async (states) => {
      for (const state of states) {
        await BusState.findOneAndUpdate({ busId: state.busId }, state, {
          upsert: true,
          new: true
        });
      }

      return BusState.find().sort({ busId: 1 }).lean();
    }
  }
});

const createRepositories = ({ useInMemoryDb, defaultUsers = [] }) => {
  const repositories = useInMemoryDb ? createMemoryRepositories({ defaultUsers }) : createMongoRepositories();
  return repositories;
};

module.exports = {
  createRepositories,
  createMemoryRepositories,
  createMongoRepositories
};
