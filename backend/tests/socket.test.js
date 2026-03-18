const http = require("http");
const { createSocketServer } = require("../src/config/socket");

describe("socket config", () => {
  test("creates a socket server", () => {
    const server = http.createServer();
    const io = createSocketServer(server, "http://localhost:5173");
    expect(io).toBeTruthy();
    io.close();
    server.close();
  });
});
