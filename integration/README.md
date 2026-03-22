# Deployment & Integration

## Deployment

The system is deployed as a split-stack web application so that each part can be scaled and maintained independently.

- **Frontend:** deployed as a static Progressive Web App using Vercel.
- **Backend:** deployed as a Node.js/Express service on a platform that supports persistent HTTP and WebSocket connections.
- **Authentication:** handled by Firebase Authentication.
- **Data storage:** handled primarily through MongoDB for user records, game history, statistics, messages, and social features.

This separation is important because the frontend delivers the user interface, while the backend is responsible for persistence, multiplayer coordination, and business logic that should not run only in the browser.


## Integration (Frontend + Backend + Model (No Machine Learning))

For this project, the term **model** does **not** refer to a machine learning model. Instead, it refers to the **deterministic chess logic and decision-making layer** used to validate moves, calculate legal positions, and generate computer moves.

This means the integrated system is best described as:

- a **React frontend** for presentation and interaction,
- a **Node.js/Express backend** for APIs, persistence, and real-time multiplayer,
- and a **rule-based chess engine** for gameplay logic.

This design satisfies the supervisor requirement because the application works **without training data, inference pipelines, neural networks, or predictive machine learning services**.

### Integrated Components

#### 1. Frontend layer

The frontend is implemented in React with TypeScript and acts as the main client application. It is responsible for:

- rendering the chessboard and game screens,
- handling user interaction,
- managing page navigation,
- calling backend REST endpoints,
- opening WebSocket connections for live multiplayer updates,
- and running local chess logic for single-player games.

In the current codebase, the frontend integration points are clearly visible in:

- `frontend/src/Services/api.ts` for HTTP requests,
- `frontend/src/Services/socket.ts` for Socket.IO communication,
- `frontend/src/Utils/chessLogic.ts` for deterministic move validation,
- `frontend/src/Utils/chessAI.ts` for rule-based AI move generation.

#### 2. Backend layer

The backend is implemented with Express and Socket.IO. It acts as the central service layer between the user interface and the database. Its responsibilities include:

- exposing REST endpoints such as `/user`, `/game`, `/friend`, `/request`, `/game-invite`, and `/message`,
- managing multiplayer rooms and game events through WebSockets,
- persisting completed game data,
- computing Elo rating updates for rated matches,
- and returning stored user/game information to the frontend.

The backend startup and route registration are handled in `backend/src/index.ts`, while the real-time game flow is coordinated in `backend/src/socket/handlers.ts`.

#### 3. Non-ML game logic layer

Instead of using machine learning, the project uses **algorithmic chess logic**.

This layer provides:

- legal move generation,
- check and checkmate detection,
- stalemate detection,
- castling and promotion handling,
- board evaluation using fixed piece values and positional weights,
- and AI move selection using minimax with alpha-beta pruning.

As a result, the computer opponent behaves intelligently through search and evaluation rather than learned behaviour. This is more explainable, easier to test, and more appropriate for a non-ML project scope.

### How the Integration Works

#### User authentication and profile synchronisation

1. A user signs in through Firebase Authentication on the frontend.
2. After authentication, the frontend can request or create the user profile through backend endpoints such as `/user/email/:email`.
3. The backend stores the application-specific profile in MongoDB, including rating, game history, and friend data.

This creates a clear division of responsibilities:

- **Firebase** confirms identity.
- **MongoDB** stores application data.
- **The frontend** presents the authenticated experience.

#### Single-player integration

In single-player mode, the frontend does not need a machine learning service or external chess engine.

The flow is:

1. The player selects AI mode in the frontend.
2. The chessboard state is maintained in the client.
3. Legal moves are validated using `chessLogic.ts`.
4. The opponent move is generated locally by `chessAI.ts` using minimax and evaluation heuristics.
5. When the game ends, the result can be sent to the backend through `/game` so it can be stored and used for statistics.

This is an important architectural point: **the AI opponent is integrated directly into the frontend as deterministic program logic, not as machine learning**.

#### Multiplayer integration

In multiplayer mode, the frontend and backend work together in real time.

1. The client connects to the backend through Socket.IO.
2. A player creates or joins a room.
3. The backend assigns colours, tracks room state, and waits for both players.
4. When the match starts, both clients receive the `gameReady` event.
5. Each move is sent through the socket using events such as `makeMove`.
6. The backend broadcasts move updates to both players.
7. When the game ends, the frontend sends the summary to the backend for storage and rating calculation.

This integration ensures that multiplayer behaviour is synchronised across both users while keeping the user interface responsive.

#### Data persistence integration

When a game finishes, the frontend sends a structured game record to the backend.

The backend then:

- stores the match in MongoDB,
- links the game to the correct user,
- calculates Elo changes for rated matches,
- updates both players' ratings when applicable,
- and exposes the updated history and statistics back to the frontend.

This makes MongoDB the **source of truth** for recent games and calculated statistics.

### End-to-End Integration Flow

<img width="1000" height="1000" src="img/Integration_Flow_Diagram.png">

### Why this is valid without Machine Learning

This integration still demonstrates a complete and technically strong system because it includes:

- frontend-backend communication,
- authentication integration,
- database integration,
- real-time socket communication,
- rule-based game processing,
- and business logic for ratings and statistics.

In other words, the project remains a full software engineering solution even when machine learning is removed.

### Supervisor-safe project positioning

For the dissertation or report, the system can be described as:

> A full-stack chess learning and gameplay platform integrating a React frontend, an Express/Socket.IO backend, Firebase Authentication, MongoDB persistence, and a deterministic rule-based chess engine for move validation and computer play.

That wording keeps the project technically accurate while avoiding any claim that the platform depends on machine learning.

### Important note about the `/predict` endpoint

The backend currently contains a `/predict` route intended to contact an external model service. However, this is **not required** for the non-machine-learning integration described above.

For a supervisor-approved non-ML version of the system, the core integrated architecture should focus on:

- frontend interaction,
- backend APIs and sockets,
- MongoDB persistence,
- Firebase authentication,
- and the local deterministic chess engine.

Therefore, the `/predict` route can be treated as an optional extension or excluded from the main integration discussion.

## More README.md
- Original README.md: [`README.md`](../README.md)
- Frontend: [`frontend/README.md`](../frontend/README.md)
- Backend: [`backend/README.md`](../backend/README.md)
- AI Model Development: [`AI-Model-Dev/README.md`](../AI-Model-Dev/README.md)