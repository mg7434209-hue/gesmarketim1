/* GES MARKETİM — bağımlılıksız statik sunucu (Railway uyumlu) */
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".woff2": "font/woff2"
};

function send(res, code, body, headers) {
  res.writeHead(code, Object.assign({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
    "Referrer-Policy": "strict-origin-when-cross-origin"
  }, headers));
  res.end(body);
}

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || "application/octet-stream";
  fs.readFile(filePath, (err, data) => {
    if (err) return serve404(res);
    const cache = ext === ".html" ? "no-cache" : "public, max-age=86400";
    send(res, 200, data, { "Content-Type": mime, "Cache-Control": cache });
  });
}

function serve404(res) {
  fs.readFile(path.join(ROOT, "404.html"), (err, data) => {
    if (err) return send(res, 404, "404 Not Found", { "Content-Type": "text/plain" });
    send(res, 404, data, { "Content-Type": "text/html; charset=utf-8" });
  });
}

const server = http.createServer((req, res) => {
  let urlPath;
  try { urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname); }
  catch (e) { return send(res, 400, "Bad Request", { "Content-Type": "text/plain" }); }

  if (urlPath === "/") urlPath = "/index.html";
  if (!path.extname(urlPath)) urlPath += ".html"; // /sepet -> /sepet.html

  const filePath = path.join(ROOT, urlPath);
  if (!filePath.startsWith(ROOT + path.sep) && filePath !== ROOT) return serve404(res);
  serveFile(res, filePath);
});

server.listen(PORT, () => {
  console.log("GES MARKETİM yayında → http://localhost:" + PORT);
});
