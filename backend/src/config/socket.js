const { Server } = require("socket.io");
const { normalizeConfiguredOrigins } = require("../utils/corsOrigin");

const createSocketServer = (httpServer, clientOrigin) =>
  new Server(httpServer, {
    cors: {
      origin: normalizeConfiguredOrigins(clientOrigin).includes("*")
        ? true
        : normalizeConfiguredOrigins(clientOrigin),
      methods: ["GET", "POST", "PATCH"]
    }
  });

module.exports = {
  createSocketServer
};
