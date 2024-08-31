import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server);

const emailToSocketMap = new Map();
const socketToEmailMap = new Map();

io.on("connection", (socket) => {
  console.log(`client connected`);
  socket.on("room:join", ({ email, room }) => {
    console.log(`data: ${email}`);
    emailToSocketMap.set(email, socket.id);
    socketToEmailMap.set(socket.id, email);
    socket.join(room);
    io.in(room).emit("user:join", { email, id: socket.id });
    io.to(socket.id).emit("room:join", { email, room });
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
