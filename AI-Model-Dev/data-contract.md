# Chess ML Data Contract (Report-First Phase)

This contract defines the minimum schema required for reproducible analytics now and position-level ML training later.

## Purpose

- Standardize exported game records from backend for Python analytics.
- Track current readiness gaps for PGN/FEN training data.
- Provide a migration target for backend schema updates.

## Required Fields (Current Export)

| Field | Type | Source | Notes |
|---|---|---|---|
| `gameId` | string | `Game._id` | Stable identifier |
| `date` | string (ISO datetime) | `Game.date` | Used for ordering/splits |
| `result` | string | `Game.result` | `win/loss/draw` expected |
| `termination` | string | `Game.termination` | checkmate/resignation/etc. |
| `isRated` | boolean | `Game.isRated` | Rated/unrated game flag |
| `timeControl` | number | `Game.timeControl` | Time control in minutes |
| `moves` | number | `Game.moves` | Move count |
| `duration` | number | `Game.duration` | Game duration in seconds |
| `playerColor` | string | `Game.playerColor` | `white/black` |
| `opponent` | string | `Game.opponent` | Opponent name/email snapshot |
| `myRating` | number | `Game.myRating` | Player pre-game rating |
| `myNewRating` | number | `Game.myNewRating` | Player post-game rating |
| `ratingChange` | number | `Game.ratingChange` | Player rating delta |
| `opponentRating` | number | `Game.opponentRating` | Opponent pre-game rating |
| `opponentNewRating` | number | `Game.opponentNewRating` | Opponent post-game rating |
| `opponentRatingChange` | number | `Game.opponentRatingChange` | Opponent rating delta |
| `myAccuracy` | number | `Game.myAccuracy` | Accuracy estimate |
| `opponentAccuracy` | number | `Game.opponentAccuracy` | Accuracy estimate |
| `userRef` | string/null | request context | `firebaseUid` or `userId` when available |

## Required Fields (Future Position-Level ML)

These fields are currently **not persisted** in backend game storage and should be added for full model training:

| Field | Type | Why Needed |
|---|---|---|
| `pgn` | string | Reconstruct all board states from one source |
| `positions[]` | array | Optional pre-expanded move-by-move records |
| `positions[].ply` | number | Sequence index |
| `positions[].fen` | string | Board-state representation for tensors |
| `positions[].sideToMove` | string | Model input context |
| `positions[].moveUci` | string | Move label/action analysis |
| `positions[].evalCp` | number | Optional supervised eval target |
| `positions[].phase` | string | Opening/middlegame/endgame conditioning |

## Quality Gates

- Missing-rate for current required export fields should remain under 5% for core analytics fields (`result`, `moves`, `duration`, `ratingChange`).
- Position readiness is blocked until `fen` and/or `pgn` persistence reaches >95% of new games.

## Versioning

- Current export schema version: `1.0.0`
- Increment schema version on any field rename/type change.
