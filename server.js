import http from "http";
import fs from "fs";
import { WebSocketServer, WebSocket } from "ws";

const PORT = 3001;

function broadcast(wss, data) {
  const payload = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

const server = http.createServer((req, res) => {
  if (req.url === "/script.js") {
    fs.readFile("./public/script.js", (err, data) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("500 Internal Server Error");
        return;
      }
      res.writeHead(200, { "Content-Type": "application/javascript" });
      res.end(data);
    });
  } else {
    fs.readFile("./public/index.html", (err, data) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("500 Internal Server Error");
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(data);
    });
  }
});

const wss = new WebSocketServer({ server });

wss.on("connection", (socket, req) => {
  const username = new URL(req.url, "http://localhost").searchParams.get(
    "username",
  );

  broadcast(wss, { type: "system", text: `${username} joined` });

  socket.on("message", (data) => {
    try {
      const parsed = JSON.parse(data.toString());
      broadcast(wss, {
        type: "chat",
        username: parsed.username,
        text: parsed.text,
      });
    } catch (err) {
      console.error("Failed to parse message:", err);
    }
  });

  socket.on("close", () => {
    broadcast(wss, { type: "system", text: `${username} left` });
  });
});

server.listen(PORT, () => {
  console.log(`Chat server running at http://localhost:3001`);
});
