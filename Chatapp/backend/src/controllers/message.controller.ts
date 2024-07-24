import { Request, Response } from "express";
import prisma from "../db/prisma.js";
import { getReceiverSocketId, io, pub, sub } from "../socket/socket.js";

// interface SocketMessage {
//     userId: string;
//     message: string;
// }

export const sendMessage = async (req: Request, res: Response) => {
	try {
		const { message } = req.body;
		const { id: receiverId } = req.params;
		const senderId = req.user.id;

		let conversation = await prisma.conversation.findFirst({
			where: {
				participantIds: {
					hasEvery: [senderId, receiverId],
				},
			},
		});

		// the very first message is being sent, that's why we need to create a new conversation
		if (!conversation) {
			conversation = await prisma.conversation.create({
				data: {
					participantIds: {
						set: [senderId, receiverId],
					},
				},
			});
		}

		const newMessage = await prisma.message.create({
			data: {
				senderId,
				body: message,
				conversationId: conversation.id,
			},
		});

		if (newMessage) {
			conversation = await prisma.conversation.update({
				where: {
					id: conversation.id,
				},
				data: {
					messages: {
						connect: {
							id: newMessage.id,
						},
					},
				},
			});
		}

		// Socket io will go here

		//redis publish
		//const msg:string = JSON.stringify(message);
		

		await pub.publish("MESSAGES", JSON.stringify({newMessage , receiverId}));

		// sub.on("message",(channel, message) => {
		// 	if(channel === "MESSAGES") {

		// 		const parsedMessage = JSON.parse(message);
    	// 		const { newMessage, receiverId } = parsedMessage;
		// 		console.log(newMessage);
		// 		console.log(receiverId);
		// 		const receiverSocketId = getReceiverSocketId(receiverId);
		// 		if (receiverSocketId) {
		// 			io.to(receiverSocketId).emit("newMessage", newMessage);
		
		// 		}

		// 	}
		// })

		// redis part END

		// socket io normal part START
		// const receiverSocketId = getReceiverSocketId(receiverId);

		// if (receiverSocketId) {
		// 	io.to(receiverSocketId).emit("newMessage", newMessage);

		// }
		
		res.status(201).json(newMessage);
		//socket io normal part END 
	} catch (error: any) {
		console.error("Error in sendMessage: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getMessages = async (req: Request, res: Response) => {
	try {
		const { id: userToChatId } = req.params;
		const senderId = req.user.id;



		const conversation = await prisma.conversation.findFirst({
			where: {
				participantIds: {
					hasEvery: [senderId, userToChatId],
				},
			},
			include: {
				messages: {
					orderBy: {
						createdAt: "asc",
					},
				},
			},
		});

		if (!conversation) {
			return res.status(200).json([]);
		}

		res.status(200).json(conversation.messages);
	} catch (error: any) {
		console.error("Error in getMessages: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getUsersForSidebar = async (req: Request, res: Response) => {
	try {
		const authUserId = req.user.id;

		const users = await prisma.user.findMany({
			where: {
				id: {
					not: authUserId,
				},
			},
			select: {
				id: true,
				fullName: true,
				profilePic: true,
			},
		});

		res.status(200).json(users);
	} catch (error: any) {
		console.error("Error in getUsersForSidebar: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
};