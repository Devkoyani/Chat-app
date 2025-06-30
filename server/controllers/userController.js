import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

// Signup a new user
export const signup = async (req, res) => {
    try {
        const { fullName, email, password, bio } = req.body;

        // 1. Validate required fields
        if (!fullName || !email || !password || !bio) {
            return res.json({ 
                success: false, 
                message: "Please fill all the fields" 
            });
        }

        // 2. Validate email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.json({ 
                success: false, 
                message: "Invalid email format" 
            });
        }

        // 3. Validate password strength
        if (!/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/.test(password)) {
          return res.json({
            success: false,
            message: "Password must contain uppercase, lowercase, number and at least 8 characters",
          });
        }

        // 4. Check if user already exists
        const user = await User.findOne({ email });
        if (user) {
            return res.json({ 
                success: false, 
                message: "User already exists" 
            });
        }

        // 5. Hash the password securely
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 6. Create the new user
        const newUser = await User.create({
            fullName,
            email,
            password: hashedPassword,
            bio,
        });

        // 7. Generate JWT token
        const token = generateToken(newUser._id);

        // 8. Return success response (excluding password)
        const userData = newUser.toObject();
        delete userData.password; // Remove password from response

        res.json({ 
            success: true, 
            userData, 
            token, 
            message: "User created successfully" 
        });

    } catch (error) {
        console.log("Signup Error:", error.message);
        res.json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
}

// Login a user
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validate required fields
        if (!email || !password) {
            return res.json({ 
                success: false, 
                message: "Please fill all the fields" 
            });
        }

        // 2. Validate email format
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.json({ 
                success: false, 
                message: "Invalid email format" 
            });
        }
        
        // 3. Check if user exists
        const userData = await User.findOne({ email }).select("+password"); 
        if (!userData) {
            return res.json({ 
                success: false, 
                message: "User does not exist" 
            });
        }

        // 4. Verify password
        const isPasswordCorrect = await bcrypt.compare(password, userData.password);
        if (!isPasswordCorrect) {
            return res.json({ 
                success: false, 
                message: "Invalid credentials" 
            });
        }

        // 5. Generate JWT token
        const token = generateToken(userData._id);

        // 6. Return user data (excluding sensitive fields)
        const user = userData.toObject();
        delete user.password;
        delete user.__v; // Remove version key if unnecessary

        res.json({ 
            success: true, 
            user, 
            token, 
            message: "User logged in successfully" 
        });

    } catch (error) {
        console.log("Login Error:", error.message);
        res.json({ 
            success: false, 
            message: "Internal server error"
        });
    }
}

// Controller to check if user is authenticated
export const checkAuth = (req, res) => {
    res.json({
        success: true,
        user: req.user,
    });
}


// Controller to update user profile details
export const updateProfile = async (req, res) => {
    try {
        const { profilePic, bio, fullName } = req.body;
        const userId = req.user._id;

        // 1. Input validation
        if (!bio && !fullName && !profilePic) {
            return res.json({
                success: false,
                message: "At least one field (bio, fullName, or profilePic) is required"
            });
        }

        // 2. Prepare update object
        const updateData = { bio, fullName };

        // 3. Handle profile picture upload if provided
        if (profilePic) {
            const upload = await cloudinary.uploader.upload(profilePic, {
                folder: 'profile-pictures',
                width: 500,
                height: 500,
                crop: 'fill'
            });
            updateData.profilePic = upload.secure_url;
        }

        // 4. Update user (excluding sensitive fields)
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { 
                new: true,
                runValidators: true, // Ensures updates follow schema rules
                select: '-password'
            }
        );

        // 5. Sanitize response
        const userResponse = updatedUser.toObject();

        res.json({
            success: true,
            user: userResponse
        });
        
    } catch (error) {
        console.error("Update Profile Error:", error);
        
        // Handle specific errors
        let message = "Internal server error";
        if (error.name === 'ValidationError') {
            message = "Validation failed: " + error.message;
        } else if (error.message.includes('Cloudinary')) {
            message = "Image upload failed";
        }

        res.json({
            success: false,
            message
        });
    }
}