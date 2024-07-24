import express from 'express';
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import {app, server} from "./socket/socket.js"
dotenv.config();



app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);


server.listen(8080,'0.0.0.0',()=>{
    console.log('Server is running on port 8080');
});

