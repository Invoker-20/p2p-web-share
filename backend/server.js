const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const crypto = require("crypto");

const app = express();

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
  socket.on("create-room", () => {
  const roomId = crypto.randomUUID().slice(0, 8);
  socket.join(roomId);
  socket.emit("room-created", roomId);
  console.log("Room created:", roomId);
});
  socket.on("join-room", (roomId) => {
  socket.join(roomId);
  socket.emit("room-joined", roomId);
  socket.to(roomId).emit("receiver-joined");
  console.log("Room joined:", roomId);
});

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
});
  socket.on("offer", ({ roomId, offer }) => {
  console.log("Offer received for room:", roomId);
  socket.to(roomId).emit("offer", offer);
});
  socket.on("answer", ({ roomId, answer }) => {
  console.log("Answer received for room:", roomId);

  socket.to(roomId).emit("answer", answer);
});
  socket.on("ice-candidate", ({ roomId, candidate }) => {
  console.log("ICE candidate forwarded");

  socket.to(roomId).emit(
    "ice-candidate",
    candidate
  );
});
  
});


const PORT =
  process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});