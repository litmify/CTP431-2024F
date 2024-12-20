import { Server as socketIo } from "socket.io";
import next from "next";
import { createServer } from "http";

const hostname = process.env.HOST_NAME;
const port = 3000;

console.log("hostname");
console.log(hostname);

console.log("next_public_server_url");
console.log(process.env.NEXT_PUBLIC_SERVER_URL);

const app = next({
  dev: process.env.NODE_ENV !== "production",
  hostname,
  port,
});
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(handler);

  const io = new socketIo(server, {});

  // Shared state
  let sharedState = {
    tracks: [],
    trackBeats: {},
    trackSounds: {},
    bpm: 120,
    gridSize: 8,
    isPlaying: false,
    currentBeat: 0,
  };

  const defaultState = { ...sharedState };

  let intervalId;

  const startBeatInterval = () => {
    clearInterval(intervalId);
    const interval = (60 / sharedState.bpm) * 1000;
    intervalId = setInterval(() => {
      sharedState.currentBeat =
        (sharedState.currentBeat + 1) % sharedState.gridSize;
      io.emit("stateUpdate", sharedState);
    }, interval);
  };

  io.on("connection", (socket) => {
    console.log("A user connected");

    // Send the current state to the newly connected client
    socket.emit("stateUpdate", sharedState);

    // Listen for state changes from clients
    socket.on("stateChange", (updatedState) => {
      const wasPlaying = sharedState.isPlaying;
      sharedState = { ...sharedState, ...updatedState };

      if (sharedState.isPlaying && !wasPlaying) {
        startBeatInterval();
      }

      if (!sharedState.isPlaying && wasPlaying) {
        clearInterval(intervalId);
      }

      // Adjust interval if BPM changes
      if (updatedState.bpm || updatedState.gridSize) {
        if (sharedState.isPlaying) {
          startBeatInterval();
        }
      }

      socket.broadcast.emit("stateUpdate", sharedState);
    });

    // Listen for reset state event
    socket.on("resetState", () => {
      sharedState = { ...defaultState };
      clearInterval(intervalId);
      io.emit("stateUpdate", sharedState);
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });
  });

  server.listen(4000, () => {
    console.log("Socket.io server running on port 4000");
  });
});
