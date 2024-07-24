import { Server } from "socket.io";
import http from "http";
import express from "express";
import {Redis} from 'ioredis';
import dotenv from "dotenv"
import cors from "cors";
dotenv.config();


const pub =  new Redis({
	host: process.env.REDIS_HOST,
    port: 17562,
	username: process.env.REDIS_USERNAME,
	password: process.env.REDIS_PASSWORD,

});
const sub =  new Redis({
	host: process.env.REDIS_HOST,
    port: 17562,
	username: process.env.REDIS_USERNAME,
	password: process.env.REDIS_PASSWORD,

});

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: "*",
		credentials: true,
		methods: ["GET", "POST"],
	},
});

sub.subscribe("MESSAGES");
sub.on("message",(channel, message) => {
	if(channel === "MESSAGES") {

		const parsedMessage = JSON.parse(message);
		const { newMessage, receiverId } = parsedMessage;
		console.log(newMessage);
		console.log(receiverId);
		const receiverSocketId = getReceiverSocketId(receiverId);
		if (receiverSocketId) {
			io.to(receiverSocketId).emit("newMessage", newMessage);

		}

	}
})


export const getReceiverSocketId = (receiverId: string) => {
	return userSocketMap[receiverId];
};

const userSocketMap: { [key: string]: string } = {}; // {userId: socketId}

io.on("connection", (socket) => {
	// console.log("a user connected", socket.id);

	const userId = socket.handshake.query.userId as string;

	if (userId) userSocketMap[userId] = socket.id;

	// io.emit() is used to send events to all the connected clients
	io.emit("getOnlineUsers", Object.keys(userSocketMap));

	// socket.on() is used to listen to the events. can be used both on client and server side
	socket.on("disconnect", () => {
		// console.log("user disconnected", socket.id);
		delete userSocketMap[userId];
		io.emit("getOnlineUsers", Object.keys(userSocketMap));
	});
});



export { app, io, server , pub ,sub};