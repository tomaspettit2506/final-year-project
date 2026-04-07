# GOTCG Backend

## Tech Stack
| Technology | Purpose |
|-----------|---------|
| Node.js   | Runtime environment |
| TypeScript | Language |
| Express.js | Web framework |
| MongoDB (via Mongoose) | Database |
| Firebase Admin SDK | Authentication & notifications |
| Jest | Testing framework |
| Docker | Containerization (optional, for deployment) |

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── config/              # Backend configuration (CORS, DB, Firebase)
│   │   ├── cors.ts          # CORS policy setup
│   │   ├── database.ts      # MongoDB connection logic
│   │   └── firebase.ts      # Firebase Admin SDK setup
│   │
│   ├── routes/              # Express route handlers (REST API endpoints)
│   │   ├── friends.ts       # Friends management endpoints
│   │   ├── gameInvites.ts   # Game invitation endpoints
│   │   ├── games.ts         # Game logic endpoints
│   │   ├── messages.ts      # Messaging endpoints
│   │   ├── requests.ts      # Friend/game requests endpoints
│   │   └── users.ts         # User profile endpoints
│   │
│   ├── schemas/             # Data validation schemas
│   │   └── index.ts         # Schema index/exports
│   │   
│   ├── socket/              # Socket.IO event handlers
│   │   └── handlers.ts      # Real-time event logic
│   │   
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts         # Type exports
│   │   
│   ├── utils/               # Utility/helper functions
│   │   ├── eloCalculator.ts # ELO rating calculation logic
│   │   ├── friend.ts        # Friend-related utilities
│   │   ├── room.ts          # Room management utilities
│   │   └── statsCalculator.ts # Game statistics calculations
│   │   
│   └── index.ts             # Backend entry point
└── tests/                   # Backend unit and integration tests
```

## Installation

1. Navigate to backend directory
```bash
cd backend
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables (create .env file)
```bash
cp .env.example .env
```

4. Then edit `backend/.env` and replace:
- `MONGO_URI` → your MongoDB connection string from MongoDB Atlas
- `FIREBASE_SERVICE_ACCOUNT_B64` → base64-encoded Firebase service account (recommended for production)
  - Generate with: `node backend/scripts/encode-service-account.js path/to/service-account.json`
- OR `FIREBASE_SERVICE_ACCOUNT` → raw JSON string (for local development only)

**⚠️ REQUIRED:** Edit `.env` and replace all placeholder values:

- **`MONGO_URI`** — MongoDB connection string from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
  - Format: `mongodb+srv://<username>:<password>@<cluster-url>/`
- **`CLIENT_URL`** — Frontend URL (default: `http://localhost:5173` for local dev)
- **`FIREBASE_SERVICE_ACCOUNT_B64`** — Base64-encoded Firebase service account JSON (**recommended for production**)
  - Generate: `node scripts/encode-service-account.js path/to/service-account.json`
- **`FIREBASE_SERVICE_ACCOUNT`** — Raw Firebase service account JSON (alternative for local dev only; not recommended for production)

5. Run the development server
```bash
npm run dev
```

## Next, AI Model Development
- AI Model Development: [`AI-Model-Dev/README.md`](../AI-Model-Dev/README.md)