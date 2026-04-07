# 🚀 DevConnect Backend (Node.js + Express + MongoDB)

A scalable backend for a social platform where users can authenticate, manage profiles, and interact through posts with likes and comments.

---

# 🧠 Project Overview

This project is built in phases to simulate real-world backend development:

* **Phase 1:** Authentication System
* **Phase 2:** User Profile System
* **Phase 3:** Post System (Social Features)

---

# 🔐 Phase 1: Authentication System

## 🚀 Features

* User Registration with OTP verification
* User Login
* JWT Authentication (Access + Refresh Tokens)
* Session Management
* Protected Routes
* Password Hashing (bcrypt)

## 📌 API Endpoints

### Register

POST /api/auth/register

### Verify OTP

POST /api/auth/verify-otp

### Login

POST /api/auth/login

### Get Current User

GET /api/auth/me

### Refresh Token

POST /api/auth/refresh-token

### Logout

POST /api/auth/logout

---

# 👤 Phase 2: User Profile System

## 🚀 Features

* View user profile
* Update profile (bio, skills, profile picture)
* Secure data handling (password excluded)
* JWT-protected profile routes

## 📌 API Endpoints

### Get User Profile

GET /api/user/:id

### Update Profile

PUT /api/user/update

---

# 🧱 Phase 3: Post System

## 🚀 Features

* Create post
* View all posts (feed)
* Like / Unlike post (toggle system)
* Comment on posts
* User-based interaction system

## 📌 API Endpoints

### Create Post

POST /api/post

### Get All Posts

GET /api/post

### Like / Unlike Post

PUT /api/post/like/:id

### Add Comment

POST /api/post/comment/:id

---

# ⚙️ Tech Stack

* Node.js
* Express.js
* MongoDB (Mongoose)
* JWT (Authentication)
* bcrypt (Password Hashing)

---

# 🔐 Security Features

* JWT-based authentication
* Protected routes using middleware
* Password hashing with bcrypt
* Sensitive data excluded from responses

---

# 🧱 Project Structure

src/
├── controllers/
├── routes/
├── models/
├── middleware/
├── config/
└── app.js

---

# ⚙️ Setup Instructions

1. Clone the repository

2. Install dependencies
   npm install

3. Create `.env` file with:
   MONGO_URI=your_mongodb_uri
   ACCESS_TOKEN_SECRET=your_secret
   REFRESH_TOKEN_SECRET=your_secret

4. Run the server
   npm run dev

---

# 💬 Key Learning Outcomes

* JWT Authentication & Authorization
* REST API Design
* Middleware Architecture
* MongoDB Data Modeling
* Debugging real backend issues
* Building scalable backend systems

---

# 🚀 Future Improvements

* Pagination (feed optimization)
* Follow/Unfollow system
* Real-time chat (Socket.io)
* Notifications system
* Image upload (Cloudinary / AWS S3)

---

# 🧑‍🤝‍🧑 Phase 4: Follow System

Implemented a social networking feature where users can follow/unfollow others and view a personalized feed.

### 🚀 Features:

* Follow / Unfollow users
* Maintain followers & following relationships
* Personalized feed (only shows posts from followed users)
* Efficient querying using MongoDB `$in` operator

### 📌 API Endpoints:

#### Follow User

PUT /api/user/follow/:id

#### Unfollow User

PUT /api/user/unfollow/:id

#### Get Personalized Feed

GET /api/post/feed


# 💡 Author

Ritik Raj
BTech CSE | Backend Developer
Preparing for FAANG 🚀
