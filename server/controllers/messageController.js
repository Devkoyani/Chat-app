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