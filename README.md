# Guardians of the Chess Grandmaster

## 🎬 Demo Screencast
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
      MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
      ```
    - Replace `<username>`, `<password>`, `<cluster>`, and `<database>` with your actual values.

6. Configure environment variables:
    - Create `/backend/.env` file with:
      ```
      MONGODB_URI=your_mongodb_connection_string
      FIREBASE_PROJECT_ID=your_firebase_project_id
      FIREBASE_PRIVATE_KEY=your_firebase_private_key
      PORT=5000
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