# Real-Time Chat Application – MERN + Socket.IO

A full-stack real-time chat application built using the MERN stack (MongoDB, Express.js, React.js, Node.js) and Socket.IO to enable instant messaging between users.

This application provides real-time communication, user authentication, and persistent message storage, ensuring seamless and reliable chat functionality.

---

## Features

### Real-Time Messaging
- Instant message delivery using Socket.IO
- Bi-directional communication between clients and server
- Live message updates without page refresh

### User Authentication
- Secure user registration and login
- Authentication using JWT (JSON Web Tokens)
- Protected routes for authorized users

### Message Storage
- Messages stored permanently in MongoDB
- Retrieve chat history anytime
- Persistent conversation records

### Online User Status
- Shows active users in real-time
- Displays online/offline status dynamically

### Responsive UI
- Clean and modern user interface
- Works on desktop and mobile devices

---

## Tech Stack

### Frontend
- React.js
- CSS
- Axios
- Socket.IO Client

### Backend
- Node.js
- Express.js
- Socket.IO
- JWT Authentication

### Database
- MongoDB
- Mongoose

### Tools
- VS Code
- Git
- GitHub
- Postman

### Platform
- Web

---

## Architecture

Client (React.js)  
↓  
Socket.IO Client  
↓  
Node.js + Express Server  
↓  
Socket.IO Server  
↓  
MongoDB Database  

---

## Project Structure
