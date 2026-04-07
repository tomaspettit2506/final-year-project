# GOTCG Frontend

## Tech Stack
| Technology | Purpose |
|-----------|---------|
| React | Language |
| TypeScript | Application framework |
| Vite | Authentication & authorisation |
| Firebase | Database access (Hibernate) |
| HTML | Relational database |
| CSS | Stateless auth tokens |

## 🏗️ Project Structure

```text
frontend/src/
├── assets/                         # Static assets (images, icons, etc.)
│
├── Components/                     # Reusable UI components
│   ├── FriendsComponent/           # Components for friends and social features
│   │   ├── AddFriend.tsx           # Add friend dialog/component
│   │   ├── ChallengeDialog.tsx     # Challenge a friend to a game
│   │   ├── ChatDialog.tsx          # Friend chat dialog
│   │   ├── FriendsList.tsx         # List of friends
│   │   ├── GameDialog.tsx          # Game invitation dialog
│   │   ├── GameInvites.tsx         # Incoming game invites
│   │   ├── PendingRequests.tsx     # Pending friend requests
│   │   ├── ProfileDialog.tsx       # Friend profile dialog
│   │   └── SentRequest.tsx         # Sent friend requests
│   │
│   ├── PlayComponents/             # Components for gameplay and chessboard
│   │   ├── AccuracyStats.tsx       # Accuracy statistics display
│   │   ├── CapturedPieces.tsx      # Captured pieces display
│   │   ├── ChessBoard.tsx          # Chessboard UI
│   │   ├── GameController.tsx      # Game controls (start, resign, etc.)
│   │   ├── GameScreen.tsx          # Main game screen
│   │   ├── GameSetup.tsx           # Game setup dialog
│   │   ├── MoveHistory.tsx         # Move history display
│   │   ├── PromotionDialog.tsx     # Pawn promotion dialog
│   │   └── Timer.tsx               # Game timer
│   │
│   ├── TutorialComponents/         # Components for tutorial/learning features
│   │   ├── Basic.tsx               # Basic tutorial step
│   │   ├── ChessPiece.tsx          # Chess piece tutorial
│   │   ├── Draw.tsx                # Draw scenarios tutorial
│   │   ├── MiniBoard.tsx           # Mini chessboard for tutorials
│   │   ├── PieceGuide.tsx          # Guide to chess pieces
│   │   ├── Pieces.tsx              # Piece movement tutorial
│   │   ├── Rules.tsx               # Chess rules tutorial
│   │   └── Winning.tsx             # Winning strategies tutorial
│   │
│   ├── AppBar.tsx                  # Top navigation bar
│   ├── BottomNav.tsx               # Bottom navigation bar
│   ├── GameDetails.tsx             # Game details modal/component
│   ├── InstallPWA.tsx              # PWA installation prompt
│   └── Loading.tsx                 # Loading spinner/component
│
├── Context/                        # React context providers
│   ├── AuthContext.tsx             # Authentication context
│   ├── BoardThemeContext.tsx       # Board theme context
│   └── ThemeContext.tsx            # App-wide theme context
│
├── Pages/                          # Page-level React components (routes)
│   ├── Friends.tsx                 # Friends page
│   ├── Home.tsx                    # Home/landing page
│   ├── Landing.tsx                 # Landing/welcome page
│   ├── Play.tsx                    # Play game page
│   ├── Profile.tsx                 # User profile page
│   ├── Settings.tsx                # Settings page
│   └── Tutorial.tsx                # Tutorial/learning page
│
├── Services/                       # API and WebSocket service modules
│   ├── api.ts                      # REST API service
│   └── socket.ts                   # Socket.IO client service
│
├── Types/                          # TypeScript type definitions
│   └── chess.ts                    # Chess-related types
│
├── Utils/                          # Utility/helper functions
│   ├── accuracyColors.ts           # Accuracy color helpers
│   ├── avatarColors.ts             # Avatar color helpers
│   ├── chessAI.ts                  # Chess AI logic
│   ├── chessLogic.ts               # Chess rules/logic helpers
│   ├── eloCalculator.ts            # ELO rating calculation
│   ├── FirestoreService.ts         # Firestore utility functions
│   ├── loadingDelay.ts             # Loading delay utility
│   ├── logoutLoading.ts            # Logout loading helper
│   ├── memberSince.ts              # Member since date helper
│   └── Notifications.ts            # Notification helpers
│
├── App.css                         # Global styles
├── App.tsx                         # Main app component
├── firebase.ts                     # Firebase config/init
├── index.css                       # Base styles
├── main.tsx                        # App entry point
└── setupTests.ts                   # Test setup file
```

## Installation
1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install frontend dependencies:
```bash
npm install
```

3. Set up environment variables (create .env file)
```bash
cp .env.example .env
# REQUIRED: replace all VITE_FIREBASE_* placeholders with real Firebase config
# REQUIRED: set VITE_API_URL / VITE_BACKEND_URL for your backend (local or deployed)
```

4. Then edit `frontend/.env` and replace:
- `VITE_FIREBASE_API_KEY` → from Firebase Console
- `VITE_FIREBASE_AUTH_DOMAIN` → from Firebase Console
- `VITE_FIREBASE_PROJECT_ID` → from Firebase Console
- `VITE_FIREBASE_STORAGE_BUCKET` → from Firebase Console
- `VITE_FIREBASE_MESSAGING_SENDER_ID` → from Firebase Console
- `VITE_FIREBASE_APP_ID` → from Firebase Console
- `VITE_FIREBASE_MEASUREMENT_ID` → from Firebase Console (optional)
- `VITE_API_URL` → set to `http://localhost:8000` for local development or your deployed backend URL

5. Run the development server
```bash
npm run dev

# Example for running application
# Run once on /frontend => AI game (:5173)
# Run twice => Multiplayer game (:5173 and :5174)
```

## 📱 PWA Support
GOTCG is a Progressive Web App, which means:

- It can be installed on your device's home screen
- It works offline or with a poor internet connection
- It loads quickly and reliably
- It supports PWA notifications

## Next, Backend Setup
- Backend Setup: [`backend/README.md`](../backend/README.md)
