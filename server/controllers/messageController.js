import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../index.js";
import mongoose from "mongoose";

// Get all users except the logged in user
export const getUsersForSidebar = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // 1. Get all users (excluding current user and sensitive fields)
        const filteredUsers = await User.find(
            { _id: { $ne: userId } },
            { password: 0, __v: 0, refreshToken: 0 } // Projection to exclude fields
        ).lean(); // Convert to plain JS objects for faster processing

       // 2. Get unseen messages count in a single optimized query
        const unseenMessagesData = await Message.aggregate([
            {
                $match: {
                    receiverId: userId,
                    seen: false,
                    senderId: { $in: filteredUsers.map(user => user._id) }
                }
            },
            {
                $group: {
                    _id: "$senderId",
                    count: { $sum: 1 }
                }
            }
        ]);

        // 3. Convert to a more usable format
        const unseenMessages = {};
        unseenMessagesData.forEach(item => {
            unseenMessages[item._id] = item.count;
        });

        res.json({
            success: true,
            users: filteredUsers,
            unseenMessages
        });

    } catch (error) {
        console.log("GetUsersForSidebar Error:", error);
        res.json({
            success: false,
            message: "Internal server error",
        });
    }
}

// Get all messages for selected user
export const getMessages = async (req, res) => {
    try {
        const { id: selectedUserId } = req.params;
        const myId = req.user._id;

        // 1. Validate selectedUserId format (optional but recommended)
        if (!mongoose.Types.ObjectId.isValid(selectedUserId)) {
            return res.json({ success: false, message: "Invalid user ID" });
        }

        // 2. Fetch messages and mark as seen in a single transaction
        const [messages] = await Promise.all([
            // Get messages (sorted by createdAt)
            Message.find({
                $or: [
                    { senderId: myId, receiverId: selectedUserId },
                    { senderId: selectedUserId, receiverId: myId },
                ],
            }).sort({ createdAt: 1 }).lean(), // Sort by oldest first

            /// Mark unseen messages as seen
            Message.updateMany(
                { 
                    senderId: selectedUserId, 
                    receiverId: myId,
                    seen: false 
                },
                { $set: { seen: true } }
            )
        ]);

        res.json({
            success: true,
            messages,
        });

    } catch (error) {
        console.log("GetMessages Error:", error);
        res.json({
            success: false,
            message: "Internal server error",
        });
    }
}

// api to mark messages as seen using message id
export const markMessagesAsSeen = async (req, res) => {
    try {
        const { id: messageId } = req.params;
        const userId = req.user._id;

        // 1. Validate message ID format
        if (!mongoose.Types.ObjectId.isValid(messageId)) {
            return res.json({ 
                success: false, 
                message: "Invalid message ID format" 
            });
        }

        // 2. Verify message exists and belongs to user before updating
        const message = await Message.findOneAndUpdate(
            {
                _id: messageId,
                receiverId: userId, // Ensure user can only mark their own messages
                seen: false // Optimize: only update if not already seen
            },
            { $set: { seen: true } },
            { new: true }
        );

        if (!message) {
            return res.json({
                success: false,
                message: "Message not found or already seen"
            });
        }

        res.json({
            success: true,
            message: "Message marked as seen successfully"
        });

    } catch (error) {
        console.log("MarkMessagesAsSeen Error:", error);
        res.json({
            success: false,
            message: "Internal server error",
        });
    }
}

// Send message to selected user
export const sendMessage = async (req, res) => {
    try {
        const {text, image} = req.body;
        const receiverId = req.params.id;
        const senderId = req.user._id;

        if (!text && !image) {
            return res.status(400).json({
                success: false,
                message: "Cannot send an empty message"
            });
        }

        let imageUrl;
        if (image) {
            try {
                const uploadResponse = await cloudinary.uploader.upload(image, {
                    folder: 'messages',
                    width: 500,
                    height: 500,
                    crop: 'fill',
                    quality: 'auto:good' // Optimize image quality
                });
                imageUrl = uploadResponse.secure_url;
            } catch (uploadError) {
                console.error("Cloudinary Upload Error:", uploadError);
                return res.json({
                    success: false,
                    message: "Failed to upload image"
                });
            }
        }

        // 4. Create and save message
        const newMessage = await Message.create({
            senderId,
            receiverId,
            text: text?.trim(), // Clean whitespace
            image: imageUrl,
            seen: false
        });

        // Emit the new message to the receiver's socket
        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage.toObject());
        }

        // 6. Prepare response (exclude unnecessary fields)
        const responseMessage = newMessage.toObject();

        res.json({
            success: true,
            message: responseMessage
        });
        
    } catch (error) {
        console.log("SendMessage Error:", error);
        res.json({
            success: false,
            message: "Internal server error",
        });
    }
}

// React to a message
export const reactToMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { emoji } = req.body;
        const userId = req.user._id;

        if (!emoji) {
            return res.status(400).json({ success: false, message: "Emoji is required" });
        }

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }

        const existingReactionIndex = message.reactions.findIndex(
            (reaction) => reaction.user.equals(userId) && reaction.emoji === emoji
        );

        if (existingReactionIndex > -1) {
            // User has already reacted with this emoji, so remove it
            message.reactions.splice(existingReactionIndex, 1);
        } else {
            // Add new reaction
            message.reactions.push({ emoji, user: userId });
        }

        await message.save();

        // Emit real-time update to both sender and receiver
        const senderSocketId = userSocketMap[message.senderId.toString()];
        const receiverSocketId = userSocketMap[message.receiverId.toString()];

        const reactionUpdate = {
            messageId: message._id,
            reactions: message.reactions,
        };

        if (senderSocketId) {
            io.to(senderSocketId).emit("messageReactionUpdate", reactionUpdate);
        }
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("messageReactionUpdate", reactionUpdate);
        }

        res.json({ success: true, reactions: message.reactions });

    } catch (error) {
        console.log("ReactToMessage Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}