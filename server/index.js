import express from 'express';
import "dotenv/config";
import morgan from 'morgan';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { connectDB } from './lib/db.js';
import userRouter from './routes/userRoutes.js';
import messageRouter from './routes/messageRoutes.js';

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
export const io = new Server(server, {
    cors: {
        origin: "*",
    }
});

// Store online users
export const userSocketMap = {}; // {userId: socketId}

// Socket.IO connection handlers
io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;

    if (userId && userId !== "undefined") {
        console.log(`User connected: ${userId}`);
        userSocketMap[userId] = socket.id;
    }

    // Emit online users to all connected clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
        if (userId && userId !== "undefined") {
            console.log(`User disconnected: ${userId}`);
            delete userSocketMap[userId];
            io.emit("getOnlineUsers", Object.keys(userSocketMap));
        }
    });
});

// Middleware setup
app.use(cors());
app.use(morgan("dev"));
app.use(express.json({limit: "4mb"}));

// Routes setup
app.use("/api/status", (req, res) => {
    res.status(200).send("Server is Live");
})
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// Connect to mongoDB
await connectDB();

// Start the server

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});