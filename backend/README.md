# GOTCG Backend

## 🏗️ Project Structure

```
backend/src/
├── config/
|   ├── cors.ts
|   ├── database.ts
|   └── firebase.ts
|
├── routes/
|   ├── friends.ts
|   ├── gameInvites.ts
|   ├── games.ts
|   ├── messages.ts
|   ├── requests.ts
|   └── users.ts
|
├── schemas/
|   └── index.ts
|   
├── socket/
|   └── handlers.ts
|   
├── types/
|   └── index.ts
|   
├── utils/
|   ├── eloCalculator.ts
|   ├── friend.ts
|   ├── room.ts
|   └── statsCalculator.ts
|   
└── index.ts
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