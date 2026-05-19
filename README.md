# 🚀 DevConnect — Developer Social & Call Network

DevConnect is a premium, real-time full-stack social networking and communication platform built specifically for software developers. It allows developers to publish posts (with image support), follow other developers, search for users by skill sets, chat in real-time with message markers, and launch high-performance 1-to-1 video calls via WebRTC.

---

## 🎨 Design & Visuals
DevConnect features a dark-themed, glassmorphic UI system built using Custom CSS variables. Every interactive component is designed with sleek hover states, clean font hierarchies (Inter), and glow animations.

---

## 🌟 Premium Features

### 1. 🔐 User Account & Authentication
- **Registration with OTP Verification**: Account registration is protected with a 6-digit OTP code emailed to the registering user using Nodemailer.
- **JWT Protection**: Sessions are authorized using secure JWT tokens.
- **User profiles**: Profiles show active biographies, lists of programming skills, and follow metrics.

### 2. 🧱 Real-Time Feed & Social Posting
- **Base64 Photo Uploads**: Users can attach images to their posts (encoded to Base64 and stored in MongoDB).
- **Auto-Refreshing Feed**: New posts appear at the top of the feed instantly for all active users without page refreshes.
- **Real-Time Likes & Comments**: Any likes or comments update visual counters across all active client feeds in real-time.
- **Following Feed**: Users can toggle between viewing all global posts or just posts from developers they follow.

### 3. 💬 Real-Time Chat & Messaging
- **1-to-1 Messaging**: Instant messaging built using Socket.IO.
- **Message Deletion**: Users can delete specific messages, which filters out of the screen for both users in real-time.
- **Delete Conversation**: A dedicated "Trash" header action allows users to clear their entire message history. If the receiver has the chat open, it wipes from their viewport in real-time too.
- **Global Unread Badges**: Tracks unread counts per individual sender. The sidebar chat icon lights up with a pulsing red badge when new messages arrive. Clicking into a conversation clears the indicator.

### 4. 🔔 Real-Time Notifications
- Whenever someone likes or comments on your post, a custom notification payload is sent directly to your socket.
- Displays an instant red indicator badge on your sidebar notifications icon.
- Prepends notifications to the notification feed in real-time if you are actively browsing that page.

### 5. 📹 WebRTC Video Calling
- **Native WebRTC Integration**: 1-to-1 video calling built using native browser `RTCPeerConnection` APIs.
- **Ephemeral Signaling**: Custom signaling routes over Socket.IO (no permanent database logs are kept for calls).
- **Premium Glassmorphic Call Modal**: An immersive calling screen offering speaker mute, video camera toggle, local picture-in-picture preview, and full-screen remote layout.

---

## 🛠 Tech Stack
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), Socket.IO, JWT, Nodemailer, Bcrypt
- **Frontend**: React (Vite), Context API, React Router, Socket.IO Client, Vanilla CSS & Glassmorphism

---

## 📂 Folder Structure

```text
connect/
├── backend/
│   ├── src/
│   │   ├── config/          # Database setups
│   │   ├── controllers/     # Controller handlers (auth, post, message, user)
│   │   ├── middleware/      # Authentication validation middlewares
│   │   ├── models/          # Mongoose Schemas (user, post, message, session)
│   │   ├── routes/          # Express routing (auth, post, message, user)
│   │   └── utils/           # Nodemailer setups & OTP generators
│   ├── server.js            # Node HTTP server & Socket.IO configuration
│   └── .env                 # Backend environment secrets
│
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios API client setup
│   │   ├── components/      # UI components (ChatWindow, Sidebar, VideoCallModal, etc.)
│   │   ├── context/         # AuthContext & CallContext providers
│   │   ├── pages/           # Views (Home, Profile, Chat, Notifications, Search, etc.)
│   │   ├── socket/          # Singleton Socket.io client instance
│   │   ├── App.jsx          # Routing & Root view mapping
│   │   ├── index.css        # Global CSS system, animations, & variables
│   │   └── main.jsx         # DOM bootstrapping
```

---

## ⚙️ Configuration & Installation

### 1. Prerequisite
Ensure you have MongoDB running locally on port `27017` (or provide a remote Mongo connection string).

### 2. Configure Backend Environment
Create a `.env` file in the `backend/` folder:
```ini
PORT=5000
MONGO_URI=mongodb://localhost:27017/devconnect
JWT_SECRET=your_jwt_strong_secret

# OTP Email Verification Setup (Nodemailer SMTP)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
```

### 3. Installation
```bash
# In backend/ directory
npm install

# In frontend/ directory
npm install
```

### 4. Running Locally
Run the following scripts in separate terminals:
```bash
# Start Backend API (runs on http://localhost:5000)
cd backend
npm run dev

# Start Frontend client (runs on http://localhost:5173)
cd frontend
npm run dev
```

---

## 💡 Author
**Ritik Raj**  
BTech CSE | Full-Stack Developer  
Preparing for FAANG 🚀
