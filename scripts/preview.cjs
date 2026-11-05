const http = require("node:http");
const https = require("node:https");
const fs = require("node:fs");
const path = require("node:path");
const calendar = require("../api/calendar");
require("./setup-session.cjs")();
const session = require("../api/session");
const root = path.resolve("dist");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".json": "application/json",
  ".css": "text/css",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".ico": "image/x-icon",
};
const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname === "/api/session") return void session(req, res);
  if (url.pathname === "/api/calendar") {
    req.query = Object.fromEntries(url.searchParams);
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (obj) => res.end(JSON.stringify(obj));
    res.send = (data) => res.end(data);
    return calendar(req, res);
  }
  if (url.pathname.startsWith("/api-proxy/")) {
    const headers = { ...req.headers, host: "api-ent.isenengineering.fr" };
    delete headers.origin;
    delete headers.referer;
    // Never forward our same-origin HttpOnly cookie to the upstream API.
    delete headers.cookie;
    const upstream = https.request(
      {
        hostname: "api-ent.isenengineering.fr",
        path: "/v1/" + url.pathname.slice("/api-proxy/".length) + url.search,
        method: req.method,
        headers,
        rejectUnauthorized: true,
        timeout: 15000,
      },
      (remote) => {
        remote.headers["cache-control"] = "private, no-store";
        res.writeHead(remote.statusCode, remote.headers);
        remote.pipe(res);
      },
    );
    upstream.on("timeout", () => upstream.destroy());
    upstream.on("error", () => {
      if (!res.headersSent) res.writeHead(502);
      res.end("Service amont indisponible.");
    });
    req.pipe(upstream);
    return;
  }
  let file = path.resolve(root, "." + decodeURIComponent(url.pathname));
  if (!file.startsWith(root + path.sep) && file !== root) {
    res.writeHead(403);
    return res.end();
  }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory())
    file = path.join(file, "index.html");
  if (!fs.existsSync(file) && fs.existsSync(file + ".html")) file += ".html";
  if (!fs.existsSync(file)) {
    res.writeHead(404);
    return res.end("Introuvable");
  }
  res.setHeader(
    "Content-Type",
    types[path.extname(file)] || "application/octet-stream",
  );
  fs.createReadStream(file).pipe(res);
});
server.listen(Number(process.env.PORT || 8081), "127.0.0.1", () =>
  console.log(`CalculNotesISEN http://127.0.0.1:${server.address().port}`),
);
