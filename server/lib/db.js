import mongoose from "mongoose";

// Function to connect to the mongoDB database
export const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/chat-app`);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
};