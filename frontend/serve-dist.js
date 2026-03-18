const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "dist");
const port = Number(process.env.FRONTEND_PORT || 4173);
const host = process.env.FRONTEND_HOST || "127.0.0.1";

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png"
};

const server = http.createServer((req, res) => {
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
