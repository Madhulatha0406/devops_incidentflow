const { Server } = require("socket.io");

const createSocketServer = (httpServer, clientOrigin) =>
  new Server(httpServer, {
    cors: {
      origin: clientOrigin,
      methods: ["GET", "POST", "PATCH"]
    }
  });

module.exports = {
  createSocketServer
};
