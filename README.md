# ChatApp - Real-time Professional Messaging Application

A professional real-time chat application built with Node.js, Express, Socket.IO, MySQL, and EJS.

## Features

- **Authentication System**
  - User registration and login
  - Password reset functionality
  - JWT-based authentication
  - Protected routes

- **Real-time Messaging**
  - Text messages
  - Emoji support
  - File sharing
  - Online/offline status
  - Read receipts
  - Typing indicators

- **User Management**
  - Contact list with online status
  - Block/unblock functionality
  - Message history
  - Unread message indicators

- **Responsive UI**
  - Mobile-friendly design
  - Professional look with Tailwind CSS

## Prerequisites

- Node.js (v14+ recommended)
- MySQL
- npm

## Installation

1. Clone the repository
```
git clone <repository-url>
cd chatapp
```

2. Install dependencies
```
npm install
```

3. Configure the environment
   - Rename `.env.example` to `.env` (or create a new `.env` file)
   - Set your database credentials and other configuration options

```
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=chatapp_db

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Cookie Settings
COOKIE_SECRET=your_cookie_secret_key_here

# File Upload Path
UPLOAD_PATH=public/uploads
```

4. Create MySQL database
```
CREATE DATABASE chatapp_db;
```

5. Run the application
```
npm start
```

## Database Schema

The application uses three main tables:

1. **users** - Stores user information and authentication details
2. **messages** - Stores all messages between users
3. **blocked_users** - Tracks blocked user relationships

Tables are automatically created on first run with the required structure.

## Development

To run the application in development mode with automatic restart:

```
npm install -g nodemon
nodemon server.js
```

## Tech Stack

- **Backend**
  - Node.js with Express.js
  - Socket.IO for real-time communication
  - MySQL database
  - bcrypt for password hashing
  - JWT for authentication
  - EJS templating engine

- **Frontend**
  - EJS for dynamic HTML
  - Tailwind CSS for styling
  - Vanilla JavaScript for client-side interactions

## Directory Structure

```
chatapp/
├── config/             # Configuration files
├── controllers/        # Route controllers
├── middlewares/        # Custom middleware
├── models/             # Database models
├── public/             # Static assets
│   ├── css/            # CSS files
│   ├── js/             # JavaScript files
│   └── uploads/        # User uploaded files
├── routes/             # Route definitions
├── utils/              # Utility functions
├── views/              # EJS templates
│   └── partials/       # Reusable template parts
├── .env                # Environment variables
├── package.json        # Project metadata
└── server.js           # Application entry point
``` 