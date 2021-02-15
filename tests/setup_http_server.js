const path = require('path');
const log = require('@whi/stdlog')(path.basename(__filename), {
  level: process.env.LOG_LEVEL || 'fatal',
});

// Start simple HTTP servers

const http = require('http');
const url = require('url');
const fs = require('fs');

const PORT = 8080;

const CONTENT_TYPES_MAP = {
  "html": "text/html",
  "jpeg": "image/jpeg",
  "jpg": "image/jpeg",
  "png": "image/png",
  "js": "text/javascript",
  "css": "text/css",
  "wasm": "application/wasm",
};

function create_server(base_dir, port) {
  const server = http.createServer(function(request, response) {
    try {
      const req_url = url.parse(request.url);

      const fs_path = base_dir + path.normalize(req_url.pathname);
      const mime_type = CONTENT_TYPES_MAP[path.extname(fs_path).slice(1).toLowerCase()] || "text/plain";

      log.normal("Looking for file @ %s", fs_path);
      var file_stream = fs.createReadStream(fs_path);
      file_stream.pipe(response);
      file_stream.on('open', function() {
        response.writeHead(200, {
          "Content-Type": mime_type,
        });
      });
      file_stream.on('error', function(e) {
        // assume the file doesn't exist
        response.writeHead(404);
        response.end();
      });
    } catch (e) {
      log.fatal("Failed to process request: %s", e);
      console.error(e);

      response.writeHead(500);
      response.end();
    }
  });

  server.listen(port);

  return server;
}

function async_wrapper(fn) {
  return new Promise(function(fulfill, reject) {
    try {
      fn(fulfill, reject);
    } catch (e) {
      reject(e);
    }
  });
}

function main() {
  const server = create_server(".", PORT);

  return {
    "servers": {
      "websdk": server,
    },
    "ports": {
      "websdk": PORT,
    },
    "close": async function() {
      return await Promise.all([
        async_wrapper(f => server.close(f)),
      ]);
    }
  };
}

module.exports = main;