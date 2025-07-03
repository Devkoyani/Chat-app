# Chat Application

A real-time chat application built with MERN stack (MongoDB, Express, React, Node.js) and Socket.io for instant messaging.

--- 

## 🔗 Live App
Visit: [devkoyani.vercel.app](https://chatappdev.vercel.app)

## Features

- 🔐 User authentication (Login/Signup)
- 💬 Real-time messaging
- 👥 Online user status
- 📸 Image sharing
- 🔔 Unread message indicators
- 📱 Responsive design

## Technologies Used

### Frontend
- React.js
- React Context API (State management)
- Socket.io-client
- Axios (HTTP requests)
- React Hot Toast (Notifications)
- Tailwind CSS (Styling)

### Backend
- Node.js
- Express.js
- MongoDB (Database)
- Mongoose (ODM)
- Socket.io (Real-time communication)
- JSON Web Tokens (Authentication)
- Cloudinary (Image storage)

### Development Tools
- Vite (Frontend build tool)
- Nodemon (Server auto-reload)
- Dotenv (Environment variables)

## 🚀 Deployment
- Backend: Deploy to Render
- Frontend: Deploy to Vercel

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/your-chat-app.git
   cd your-chat-app
   ```
2. Install dependencies
   ```bash
   # Install server dependencies
    cd server
    npm install
   # Install client dependencies
    cd ../client
    npm install
   ```
3. Create a .env file in the server directory with the following variables:
   ```bash
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   ```
4. Run the application
   ```bash
   # Start the server (from server directory)
    npm run server
   # Start the client (from client directory)
    npm run dev
   ```
## 🧑‍💻 Author Dev Koyani
