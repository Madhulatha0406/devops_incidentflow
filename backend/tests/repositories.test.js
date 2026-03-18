const { User } = require("../src/models/User");
const { Incident } = require("../src/models/Incident");
const { BusState } = require("../src/models/BusState");
const { createMemoryRepositories, createMongoRepositories, createRepositories } = require("../src/repositories/createRepositories");
const { defaultUsers } = require("../src/config/defaultUsers");

describe("repositories", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("memory repositories filter incidents and persist buses", async () => {
    const repositories = createMemoryRepositories({ defaultUsers });
    const student = await repositories.users.findByEmail("student@incidentflow.local");
    const technician = await repositories.users.findByEmail("tech@incidentflow.local");

    const created = await repositories.incidents.create({
      title: "Lab PC broken",
      reporterId: student._id,
      technicianId: technician._id,
      status: "open"
    });

    expect((await repositories.incidents.list({ reporterId: student._id })).length).toBe(1);
    expect((await repositories.incidents.list({ technicianId: technician._id })).length).toBe(1);
    expect((await repositories.incidents.list({ status: "resolved" })).length).toBe(0);

    await repositories.incidents.update(created._id, { status: "resolved" });
    expect((await repositories.incidents.findById(created._id)).status).toBe("resolved");

    await repositories.buses.saveAll([{ busId: "BUS-1" }]);
    expect((await repositories.buses.listAll())[0].busId).toBe("BUS-1");
  });

  test("createRepositories returns the requested mode", () => {
    expect(createRepositories({ useInMemoryDb: true }).mode).toBe("memory");
    expect(createRepositories({ useInMemoryDb: false }).mode).toBe("mongo");
  });

  test("mongo repositories delegate to mongoose models", async () => {
    jest
      .spyOn(User, "findOne")
      .mockResolvedValueOnce(null)
      .mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    jest.spyOn(User, "create").mockResolvedValue({ toObject: () => ({ _id: "user-1" }) });
    jest.spyOn(User, "find").mockReturnValue({ lean: jest.fn().mockResolvedValue([{ _id: "user-1" }]) });
    jest.spyOn(User, "findById").mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: "user-1" }) });

    jest.spyOn(Incident, "create").mockResolvedValue({ toObject: () => ({ _id: "inc-1" }) });
    jest.spyOn(Incident, "find").mockReturnValue({ sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) });
    jest.spyOn(Incident, "findById").mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: "inc-1" }) });
    jest.spyOn(Incident, "findByIdAndUpdate").mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: "inc-1", status: "open" }) });

    jest.spyOn(BusState, "find").mockReturnValue({ sort: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([{ busId: "BUS-1" }]) }) });
    jest.spyOn(BusState, "findOneAndUpdate").mockResolvedValue(undefined);

    const repositories = createMongoRepositories();
    await repositories.users.seedDefaults([
      { name: "Admin", email: "admin@example.com", password: "Password123!", role: "admin" }
    ]);
    await repositories.users.create({ name: "User" });
    await repositories.users.findByEmail("admin@example.com");
    await repositories.users.findById("user-1");
    await repositories.users.list();
    await repositories.incidents.create({ title: "Issue" });
    await repositories.incidents.findById("inc-1");
    await repositories.incidents.list();
    await repositories.incidents.update("inc-1", { status: "open" });
    await repositories.buses.listAll();
    await repositories.buses.saveAll([{ busId: "BUS-1" }]);

    expect(User.create).toHaveBeenCalled();
    expect(Incident.findByIdAndUpdate).toHaveBeenCalled();
    expect(BusState.findOneAndUpdate).toHaveBeenCalled();
  });
});
