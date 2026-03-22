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
├── assets/
|
├── Components/
│   ├── FriendsComponent/
|   |   ├── AddFriend.tsx
|   |   ├── ChallengeDialog.tsx
|   |   ├── ChatDialog.tsx
|   |   ├── FriendsList.tsx
|   |   ├── GameDialog.tsx
|   |   ├── GameInvites.tsx
|   |   ├── PendingRequests.tsx
|   |   ├── ProfileDialog.tsx
|   |   └── SentRequest.tsx
|   |   
│   ├── PlayComponents/
|   |   ├── AccuracyStats.tsx
|   |   ├── CapturedPieces.tsx
|   |   ├── ChessBoard.tsx
|   |   ├── GameController.tsx
|   |   ├── GameScreen.tsx
|   |   ├── GameSetup.tsx
|   |   ├── MoveHistory.tsx
|   |   ├── PromotionDialog.tsx
|   |   └── Timer.tsx
|   |   
│   ├── TutorialComponents/
|   |   ├── Basic.tsx
|   |   ├── ChessPiece.tsx
|   |   ├── Draw.tsx
|   |   ├── MiniBoard.tsx
|   |   ├── PieceGuide.tsx
|   |   ├── Pieces.tsx
|   |   ├── Rules.tsx
|   |   └── Winning.tsx
|   |   
|   ├── AppBar.tsx
|   ├── BottomNav.tsx
|   ├── GameDetails.tsx
|   ├── InstallPWA.tsx
|   └── Loading.tsx
|
├── Context/
|   ├── AuthContext.tsx
|   ├── BoardThemeContext.tsx
|   └── ThemeContext.tsx
|   
├── Pages/
|   ├── Friends.tsx
|   ├── Home.tsx
|   ├── Landing.tsx
|   ├── Play.tsx
|   ├── Profile.tsx
|   ├── Settings.tsx
|   └── Tutorial.tsx
|   
├── Services/
|   ├── api.ts
|   └── socket.ts
|   
├── Types/
|   └── chess.ts
|   
├── Utils/
|   ├── accuracyColors.ts
|   ├── avatarColors.ts
|   ├── chessAI.ts
|   ├── chessLogic.ts
|   ├── eloCalculator.ts
|   ├── FirestoreService.ts
|   ├── loadingDelay.ts
|   ├── logoutLoading.ts
|   ├── memberSince.ts
|   └── Notifications.ts
|   
|   
├── App.css
├── App.tsx
├── firebase.ts
├── index.css
├── main.tsx
└── setupTests.ts
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
