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
├── index.ts
```

## Installation

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Set up environment variables (create .env file)
cp .env.example .env
# Edit .env with your configuration

# Run the development server
npm run dev
```