# Social Chat App

A modern chat + social app combining Instagram + Messenger + Facebook Feed features.

## Features

- 🧍‍♂️ User System (Signup/Login, Profiles, Follow/Unfollow)
- 💬 Real-time Chat (1-on-1 & Group chats with Socket.io)
- 🏞️ Post Feed (Create, Like, Comment, Share posts)
- 🎥 Stories (24-hour disappearing content)
- 🔔 Notifications (Real-time alerts)
- 🔍 Explore Page (Discover trending content)
- ⚙️ Settings (Profile edit, Privacy, Dark mode)

## Tech Stack

### Frontend
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion
- Socket.io Client

### Backend
- Node.js
- Express.js
- Socket.io
- MongoDB
- JWT Authentication
- Cloudinary (Media Storage)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
# Backend (.env)
MONGODB_URI=mongodb://localhost:27017/social-chat-app
JWT_SECRET=your-jwt-secret
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

3. Start development servers:
```bash
npm run dev
```

This will start both frontend (http://localhost:3000) and backend (http://localhost:5000) servers.

## Project Structure

```
social-chat-app/
├── frontend/          # Next.js frontend
├── backend/           # Node.js backend
├── shared/           # Shared types and utilities
└── docs/             # Documentation
```

## API Endpoints

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me

### Users
- GET /api/users/search
- GET /api/users/:id
- POST /api/users/:id/follow
- DELETE /api/users/:id/follow

### Posts
- GET /api/posts/feed
- POST /api/posts
- GET /api/posts/:id
- POST /api/posts/:id/like
- POST /api/posts/:id/comment

### Messages
- GET /api/messages/:chatId
- POST /api/messages
- GET /api/chats

### Stories
- GET /api/stories
- POST /api/stories
- GET /api/stories/:id/viewers

## Database Schema

### Users
```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  password: String,
  profilePic: String,
  bio: String,
  followers: [ObjectId],
  following: [ObjectId],
  isPrivate: Boolean,
  createdAt: Date
}
```

### Posts
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  caption: String,
  media: [String],
  likes: [ObjectId],
  comments: [{
    userId: ObjectId,
    text: String,
    createdAt: Date
  }],
  createdAt: Date
}
```

### Messages
```javascript
{
  _id: ObjectId,
  chatId: ObjectId,
  senderId: ObjectId,
  content: String,
  media: [String],
  seen: Boolean,
  createdAt: Date
}
```

### Stories
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  media: String,
  viewers: [ObjectId],
  expiresAt: Date,
  createdAt: Date
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License
