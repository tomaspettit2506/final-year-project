# Guardians of the Chess Grandmaster

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Audiowide&display=swap" rel="stylesheet">

<style>
body {
  font-family: "Audiowide", sans-serif;
}

img{
   border-radius: 15px;
}
</style>

<p align="center">
  <img src="frontend/public/icon-192.png" alt="GOTCG Logo" width="150" height="150" style->
</p>

<p align="center" style="font-size: 20px;>
  <strong>Your Chess Journey Awaits</strong>
</p>

<p align="center">
  <a href="https://tomaspettit2506.github.io/final-year-project/">https://tomaspettit2506.github.io/final-year-project/</a>
</p>

## 🎬 Screencast Demonstration
[Need to add Screencast Video]

## 📄 Dissertation Document
[Need to add a link of my Dissertation Document (.pdf)]

## 📚 Overview
**Guardians of the Chess Grandmaster** (GOTCG) is a tailored platform that utilizes AI to enhance your chess learning experience. It offers personalized tools and resources to help players develop their skills and understand the game better. With its advanced study strategies, users can build a custom approach to their training, focusing on areas that need improvement while also tracking their progress over time.

The platform includes interactive lessons, puzzles, and gameplay analysis to reinforce learning and elevate performance. Whether you're a beginner looking to grasp the fundamentals or an advanced player aiming to refine your strategies, GOTCG provides the resources necessary to elevate your chess game. The portfolio-building aspect allows players to showcase their growth and achievements, making it a comprehensive tool for serious chess enthusiasts.

## ✨ Features
* 🔒 __Authentication:__ Email/password and Google Sign-In via Firebase
* 📅 __Tutorial System:__ Learn chess basics, pieces, rules, and winning strategies
* 🎮 __Game Management:__ Create, join, and play chess games
* 👤 __User Profiles:__ Track ratings, game history, and achievements
* 📳 __Real-time Communication:__ WebSocket support for live gameplay
* 🔁 __Responsive Design:__ Works across devices with PWA installation support

## 🛠️ Technology Stack
* **Frontend:** React + TypeScript with Vite, using Material-UI components and Framer Motion animations
* **Backend:** Node.js/Express server handling API routes and real-time features via Socket.IO
* **Database:** Firebase (Authentication & Firestore) + MongoDB (game data & analytics)
* **Deployment:** PWA (Progressive Web App) - installable on devices with offline support

## 🏗️ Project Structure
* ``/frontend``: React SPA application
    * ``/src``: Source files
        * ``/Components``: Reusable React components
        * ``/Context``: React Context for state management
        * ``/Pages``: Page components (views)
        * ``/Services``: API and external service integrations
        * ``/Types``: TypeScript type definitions
        * ``/Utils``: Utility functions and helpers
* ``/backend``: Node.js/Express server
    * ``/src``: Source code
        * ``/config``: Configuration files (database, Firebase)
        * ``/routes``: API route handlers (friends, gameInvites, games, requests, users)
        * ``/schemas``: Data validation schemas
        * ``/socket``: WebSocket event handlers
        * ``/types``: TypeScript type definitions
        * ``/utils``: Utility functions (friend, room management)
    * ``package.json``: Dependencies and scripts
    * ``.env``: Environment variables

## 🚀 Getting Started

### Prerequisites

- Node.js (v22)
- npm or yarn
- Firebase CLI (`npm install -g firebase-tools`)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/final-year-project.git
cd final-year-project
```

   
2. Install frontend dependencies:
```bash
1. Navigate to frontend directory
   cd frontend

2. Install dependencies
   npm install
  
3. Set up environment variables (create .env file)
   # Configure environment
   cp .env.example .env

   # Edit .env if using different API URLs

4. Run the development server
   npm run dev
  
5. Example for running application
   # Run once on /frontend => AI game (:5173)
   # Run twice, => Multiplayer game (:5173 and :5173 (Increment 1))
```

3. Install backend dependencies:
```bash
# Example for Node.js backend
1. Navigate to backend directory
   cd backend

2. Install dependencies
   npm install
  
3. Set up environment variables (create .env file)
   # Configure environment
   cp .env.example .env

   # Edit .env if using different API URLs

4. Run the development server
   npm run dev
```

4. Configure Firebase:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Set up Authentication, Firestore, Functions, etc.
   - Add your Firebase config to `/frontend/src/firebase.ts`


5. Configure MongoDB API:
    - Sign in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (or use a local MongoDB instance if you prefer).
    - In Atlas, create a free/shared cluster.
    - Create a database user with a strong password.
    - Add your IP to the Network Access allowlist (or `0.0.0.0/0` only for temporary local dev).
    - Click "Connect" and select "Drivers" to get your connection string.
    - Add your MongoDB connection string to `/backend/.env`:
      ```
      MONGODB_URI=mongodb+srv://<username>:<password>@gotcg.cxm6vsx.mongodb.net/
      ```
    - Replace `<username>` and `<password>` with your actual values.

6. Configure environment variables:
    - Create `/backend/.env` file with:
      ```
      MONGODB_URI=your_mongodb_connection_string
      FIREBASE_PROJECT_ID=your_firebase_project_id
      FIREBASE_PRIVATE_KEY=your_firebase_private_key
      PORT=8000
      ```
    - Create `/frontend/.env` file with:
      ```
      VITE_FIREBASE_API_KEY=your_firebase_api_key
      VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
      VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
      ```

## 📱 PWA Support
GOTCG is a Progressive Web App, which means:

- It can be installed on your device's home screen
- It works offline or with a poor internet connection
- It loads quickly and reliably
- It can be showing on the PWA Notifications

## Troubleshooting

### Frontend Issues

**Issue: Port 5173 already in use**
```bash
# Kill the process using port 5173
lsof -i :5173
kill -9 <PID>

# Or run on a different port
npm run dev -- --port 5174
```

**Issue: Firebase configuration errors**
- Verify your Firebase config in `/frontend/src/firebase.ts` matches your Firebase Console project
- Check that Authentication and Firestore are enabled in Firebase Console
- Ensure your API key has the correct restrictions in Firebase Console

**Issue: Module not found errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Issue: Vite hot reload not working**
- Check that your `.env` file is correctly configured
- Restart the dev server: `npm run dev`
- Clear browser cache and hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

**Issue: CORS errors when calling backend**
- Verify backend is running on the correct port (default: 5000)
- Check `VITE_API_URL` in `/frontend/.env` matches your backend URL
- Ensure backend CORS configuration includes your frontend URL

### Backend Issues

**Frontend can't reach backend:**
- Check backend is running on port 8000
- Ensure port 8000 is Public in the "Ports" tab (Codespaces defaults to Private)
- Refresh the page after changing port visibility

**Issue: Port 8000 already in use**
```bash
# Kill the process using port 8000
lsof -i :8000
kill -9 <PID>

# Or change PORT in .env
echo "PORT=8001" >> .env
```

**Issue: MongoDB connection failed**
- Verify `MONGODB_URI` in `/backend/.env` is correct
- Check your MongoDB Atlas IP allowlist includes your dev machine (or use `0.0.0.0/0` temporarily)
- Ensure your database user credentials are correct
- Test connection: `mongosh "<your_connection_string>"`

**Issue: Firebase authentication errors in backend**
- Verify `FIREBASE_PROJECT_ID` and `FIREBASE_PRIVATE_KEY` in `/backend/.env`
- Ensure your Firebase service account JSON is correctly formatted (no line breaks in private key)
- Download fresh service account key from Firebase Console if needed

**Issue: Socket.IO connection errors**
- Check that Socket.IO is properly initialized on both frontend and backend
- Verify backend is listening on the correct WebSocket port
- Check browser console for connection errors
- Ensure firewall allows WebSocket connections

**Issue: Environment variables not loading**
```bash
# Verify .env file exists in correct location
ls -la .env

# Restart the dev server
npm run dev
```

**Issue: Dependencies installation fails**
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### General Troubleshooting

**Check application logs:**
```bash
# Frontend (Vite dev server logs are in terminal)
# Backend (check terminal output for errors)

# Use verbose logging if available
npm run dev -- --debug
```

**Verify all services are running:**
```bash
# Check if frontend is running
curl http://localhost:5173

# Check if backend is running
curl http://localhost:8000/health

# Check if MongoDB is accessible
mongosh "<your_connection_string>"
```

**Still stuck?**
- Check the project's Issue tracker on GitHub
- Review browser DevTools Console and Network tabs
- Check backend server logs for detailed error messages
- Ensure all prerequisites (Node.js v22, npm, Firebase CLI) are installed
