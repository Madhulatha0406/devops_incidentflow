const { AppError } = require("../utils/appError");
const { verifyToken } = require("../utils/jwt");

const createAuthenticate = ({ authService, jwtSecret }) => async (req, _res, next) => {
  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    next(new AppError("Authentication token is required", 401));
    return;
  }

  try {
    const token = header.replace("Bearer ", "").trim();
    const payload = verifyToken(token, jwtSecret);
    const user = await authService.getUserById(payload.sub);

    if (!user) {
      next(new AppError("Authenticated user was not found", 401));
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    next(new AppError("Invalid or expired token", 401));
  }
};

const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) {
    next(new AppError("Authentication is required", 401));
    return;
  }

  if (!roles.includes(req.user.role)) {
    next(new AppError("You are not allowed to access this resource", 403));
    return;
  }

  next();
};

module.exports = {
  createAuthenticate,
  authorize
};
