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

## Frontend Installation
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
# Edit .env if using different API URLs
```

4. Run the development server
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
