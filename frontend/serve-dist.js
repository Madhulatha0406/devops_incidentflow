const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "dist");
const port = Number(process.env.FRONTEND_PORT || 4173);
const host = process.env.FRONTEND_HOST || "127.0.0.1";
const backendHost = process.env.BACKEND_HOST || "127.0.0.1";
const backendPort = Number(process.env.BACKEND_PORT || 5000);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png"
};

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/") || req.url === "/health") {
    const proxyRequest = http.request(
      {
        hostname: backendHost,
        port: backendPort,
        path: req.url,
        method: req.method,
        headers: req.headers
      },
      (proxyResponse) => {
        res.writeHead(proxyResponse.statusCode || 502, proxyResponse.headers);
        proxyResponse.pipe(res);
      }
    );

    proxyRequest.on("error", () => {
      res.statusCode = 502;
      res.end("Backend unavailable");
    });

    req.pipe(proxyRequest);
    return;
  }

  const requestPath = req.url === "/" ? "/index.html" : req.url;
  const filePath = path.join(root, requestPath.replace(/^\/+/, ""));

  fs.readFile(filePath, (error, data) => {
    if (error) {
      if (requestPath !== "/index.html") {
        fs.readFile(path.join(root, "index.html"), (fallbackError, fallbackData) => {
          if (fallbackError) {
            res.statusCode = 404;
            res.end("Not found");
            return;
          }

          res.setHeader("Content-Type", contentTypes[".html"]);
          res.end(fallbackData);
        });
        return;
      }

      res.statusCode = 404;
      res.end("Not found");
      return;
    }

    const extension = path.extname(filePath);
    res.setHeader("Content-Type", contentTypes[extension] || "application/octet-stream");
    res.end(data);
  });
});

server.listen(port, host, () => {
  console.log(`IncidentFlow+ frontend serving at http://${host}:${port}`);
});
