import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import connectDB from "./src/config/db.js";
import requestRoutes from "./src/routes/requestRoutes.js";

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
app.use("/uploads", express.static("uploads"));
// Socket.IO Setup
const io = new Server(server, {
  cors: { origin: "*" },
});

// Make io available in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(cors());
app.use(express.json());

// Routes
app.use("/api", requestRoutes);

io.on("connection", (socket) => {
  console.log("Client Connected:", socket.id);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log("Server running on PORT", PORT));
