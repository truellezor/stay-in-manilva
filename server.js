import { createReadStream, existsSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";

const port = Number(process.env.PORT || 4173);
const root = process.cwd();
const types = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "text/javascript"
};

function resolvePath(url) {
  const cleanPath = new URL(url, `http://localhost:${port}`).pathname;
  const requested = cleanPath === "/" ? "index.html" : cleanPath.slice(1);
  const filePath = resolve(join(root, requested));
  return filePath.startsWith(root) ? filePath : join(root, "index.html");
}

createServer(async (request, response) => {
  const filePath = resolvePath(request.url);

  if (!existsSync(filePath)) {
    response.writeHead(404, { "content-type": "text/plain" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "content-type": types[extname(filePath)] || "application/octet-stream",
    "x-content-type-options": "nosniff"
  });
  createReadStream(filePath).pipe(response);
}).listen(port);
