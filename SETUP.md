# Social Chat App - Setup Guide

## 🚀 Quick Start

This is a complete social media + chat application built with modern technologies. Follow these steps to get it running:

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- Cloudinary account (for media storage)

### 1. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
MONGODB_URI=mongodb://localhost:27017/social-chat-app
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

Start the backend server:
```bash
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env.local` file in the frontend directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

Start the frontend development server:
```bash
npm run dev
```

### 3. Database Setup

Make sure MongoDB is running locally or use MongoDB Atlas. The app will automatically create the necessary collections when you start using it.

## 🎯 Features Implemented

### ✅ Core Features
- **User Authentication**: JWT-based login/register system
- **User Profiles**: Profile management, follow/unfollow system
- **Real-time Chat**: 1-on-1 and group messaging with Socket.io
- **Post Feed**: Create, like, comment, and share posts
- **Stories**: 24-hour disappearing content with reactions
- **Notifications**: Real-time notifications for all interactions
- **Media Upload**: Image and video support via Cloudinary
- **Responsive Design**: Mobile-first responsive UI
- **Dark Mode**: Toggle between light and dark themes

### 🎨 UI Components
- Modern, Instagram-like interface
- Smooth animations with Framer Motion
- Tailwind CSS for styling
- Responsive sidebar navigation
- Interactive post cards with media support
- Story circles with gradient borders
- Real-time typing indicators
- Online/offline status indicators

### 🔧 Technical Features
- **Backend**: Node.js + Express + Socket.io
- **Frontend**: Next.js 14 + React 18 + TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with secure storage
- **File Upload**: Multer + Cloudinary integration
- **Real-time**: Socket.io for live chat and notifications
- **State Management**: Zustand for client-side state
- **Form Handling**: React Hook Form with validation

## 📱 Usage

1. **Register/Login**: Create an account or login with existing credentials
2. **Create Posts**: Upload images/videos with captions and hashtags
3. **Follow Users**: Discover and follow other users
4. **Chat**: Send real-time messages to friends
5. **Stories**: Share temporary content that disappears after 24 hours
6. **Notifications**: Get real-time alerts for interactions

## 🛠️ Development

### Project Structure
```
social-chat-app/
├── backend/                 # Node.js API server
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API endpoints
│   ├── middleware/        # Auth & validation
│   └── server.js          # Main server file
├── frontend/              # Next.js React app
│   ├── app/               # App router pages
│   ├── components/         # React components
│   ├── store/             # Zustand state stores
│   └── lib/               # Utilities & API client
└── README.md              # This file
```

### API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

#### Users
- `GET /api/users/search` - Search users
- `GET /api/users/:id` - Get user profile
- `POST /api/users/:id/follow` - Follow user
- `DELETE /api/users/:id/follow` - Unfollow user

#### Posts
- `GET /api/posts/feed` - Get feed posts
- `POST /api/posts` - Create post
- `POST /api/posts/:id/like` - Like/unlike post
- `POST /api/posts/:id/comment` - Add comment
- `POST /api/posts/:id/share` - Share post

#### Messages
- `GET /api/messages/chats` - Get user chats
- `POST /api/messages/chat` - Create/join chat
- `GET /api/messages/:chatId/messages` - Get chat messages
- `POST /api/messages/:chatId/messages` - Send message

#### Stories
- `GET /api/stories/feed` - Get stories feed
- `POST /api/stories` - Create story
- `POST /api/stories/:id/view` - View story
- `POST /api/stories/:id/reaction` - React to story

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS configuration
- Input validation and sanitization
- Secure file upload handling
- Helmet.js for security headers

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas or use a cloud MongoDB service
2. Configure Cloudinary for media storage
3. Deploy to platforms like Heroku, Railway, or DigitalOcean
4. Set environment variables in production

### Frontend Deployment
1. Build the Next.js app: `npm run build`
2. Deploy to Vercel, Netlify, or similar platforms
3. Configure environment variables
4. Update API URLs for production

## 🎯 Next Steps

The app is fully functional with all core features implemented. You can extend it with:

- Video calling (WebRTC)
- Push notifications
- Advanced search filters
- Post scheduling
- Live streaming
- AI-powered content recommendations
- Mobile app (React Native)

## 📄 License

MIT License - feel free to use this project for learning or as a starting point for your own social media app!

---

**Happy coding! 🎉**
