const bcrypt = require("bcryptjs");
const { AppError } = require("../utils/appError");
const { signToken } = require("../utils/jwt");

const sanitizeUser = (user) => {
  if (!user) {
    return null;
  }

  const { passwordHash, ...safeUser } = user;
  return {
    ...safeUser,
    _id: safeUser._id ? String(safeUser._id) : safeUser._id
  };
};

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const createAuthService = ({ repositories, jwtSecret, jwtExpiresIn, bcryptLib = bcrypt }) => ({
  seedDefaultUsers: async (defaultUsers) => repositories.users.seedDefaults(defaultUsers),
  createUser: async ({ name, email, password, role = "student", department }) => {
    const normalizedEmail = normalizeEmail(email);
    const existing = await repositories.users.findByEmail(normalizedEmail);

    if (existing) {
      throw new AppError("User already exists with this email", 409);
    }

    const passwordHash = await bcryptLib.hash(password, 10);
    const user = await repositories.users.create({
      name,
      email: normalizedEmail,
      passwordHash,
      role,
      department: department || "Campus Services"
    });

    return sanitizeUser(user);
  },
  registerStudent: async (payload) =>
    sanitizeUser(
      await (async () => {
        const normalizedEmail = normalizeEmail(payload.email);
        const existing = await repositories.users.findByEmail(normalizedEmail);

        if (existing) {
          throw new AppError("User already exists with this email", 409);
        }

        return repositories.users.create({
          name: payload.name,
          email: normalizedEmail,
          passwordHash: await bcryptLib.hash(payload.password, 10),
          role: "student",
          department: payload.department || "Campus Services"
        });
      })()
    ),
  login: async ({ email, password }) => {
    const user = await repositories.users.findByEmail(normalizeEmail(email));

    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    const isValidPassword = await bcryptLib.compare(password, user.passwordHash);

    if (!isValidPassword) {
      throw new AppError("Invalid email or password", 401);
    }

    const token = signToken(
      {
        sub: user._id,
        role: user.role,
        email: user.email
      },
      jwtSecret,
      jwtExpiresIn
    );

    return {
      token,
      user: sanitizeUser(user)
    };
  },
  listUsers: async () => (await repositories.users.list()).map(sanitizeUser),
  getUserById: async (id) => sanitizeUser(await repositories.users.findById(id))
});

module.exports = {
  createAuthService,
  sanitizeUser,
  normalizeEmail
};
