# AI Model Development: Data Collection, Training, and Optimization
Based on your chess application workspace, here's how AI model development works in the context of your project:

## Data Collection
In your chess application, data collection happens through:

1. Game History Recording
    - Every move is tracked in the `GameScreen` component
    - Move accuracy is calculated using `calculateMoveAccuracy` which compares player moves against optimal AI moves
    - Game outcomes are stored in MongoDB via the games API

2. Player Performance Metrics

````javascript
// Data stored per game includes:
- opponent information
- move count
- game duration
- accuracy percentages (myAccuracy, opponentAccuracy)
- termination type (checkmate, resignation, timeout, draw)
- rating changes
````

3. Move Evaluation Data

    - The `chessAI.ts` evaluates each position using piece values and position bonuses
    - Each move gets classified as: excellent, good, inaccuracy, mistake, or blunder
    - This classification data can be used to train more sophisticated models
    
## Training
Your current AI uses a rule-based approach with evaluation functions, but here's how you could implement Non-ML training:

1. Position Evaluation
````typescript
// Current approach in chessAI.ts uses hardcoded piece-square tables
const PIECE_VALUES = { pawn: 100, knight: 320, bishop: 330, ... }
const POSITION_BONUS = { pawn: [...], knight: [...], ... }
````

2. Potential Non-ML Enhancement

    - Collect position-outcome pairs from your game database
    - Train a neural network to predict position strength
    - Use supervised learning with labeled positions (winning/losing/draw)
    - Fine-tune based on different difficulty levels

3. Minimax with Learned Evaluation

    - Current `minimax` uses static evaluation
    - Could be enhanced with a trained model to evaluate leaf nodes
    - Different depth levels (2-4 ply) based on difficulty already implemented

## Optimization
Your application already implements several optimization techniques:

1. Algorithm Optimization
````typescript
// Alpha-beta pruning in minimax function
if (beta <= alpha) break; // Prune branches
````

2. Difficulty-Based Optimization

    - Easy (250-550): Quick evaluation with randomness
    - Medium (550-900): Basic position evaluation
    - Hard (900-1300): 2-ply minimax search
    - Expert (1300-1700): 3-ply minimax search
    - Master (1700-2200): 4-ply minimax search
    - Rocket (2200+): 5-ply minimax search

3. Performance Optimizations
````typescript
// AI thinking time is adjusted by difficulty
let thinkingTime: number;
if (difficultyRef.current < 550) {
  thinkingTime = 100 + Math.random() * 100; // 100-200ms
} else if (difficultyRef.current < 900) {
  thinkingTime = 200 + Math.random() * 200; // 200-400ms
}
// ... progressively longer for higher difficulties
````


## Potential Non-ML Integration for Your Project

To enhance your chess AI and analytics without using machine learning:

1. Data Pipeline
    - Export game data from MongoDB using the games endpoint
    - Extract board positions and outcomes
    - Use deterministic labeling and rule-based evaluation (e.g., win/loss/draw, move accuracy, blunder detection)

2. Rule-Based Evaluation Architecture
    - Continue using piece-square tables, material count, and handcrafted heuristics for board evaluation
    - Input: 8x8 board representation (piece types and colors)
    - Output: Position evaluation score based on fixed rules

3. Analytics and Reporting
    - Use Python scripts to generate statistics, charts, and reports from exported data
    - No predictive modeling or neural networks are used

4. Integration
    - The evaluateBoard function remains deterministic and explainable
    - Minimax search algorithm is used for AI move selection
    - All evaluations are based on static rules, not learned models

5. Continuous Improvement
    - Improve heuristics and evaluation functions based on playtesting and user feedback
    - Update rule-based logic as needed for better gameplay experience

Your current architecture is fully compliant with a Non-ML approach. All AI, analytics, and reporting are performed using deterministic, rule-based methods and traditional programming, with no machine learning or neural networks involved.

## Implemented Scripts (Report-First Phase)

The following Python scripts are now implemented in `AI-Model-Dev` to support a reproducible data + analytics pipeline:

1. `data_export.py`
   - Normalizes game records from local JSON and/or backend games API.
   - Writes deterministic, versioned exports to `data/raw/` (JSON + CSV + manifest).
   - Maintains `*_latest` files for downstream scripts.

2. `preprocess_positions.py`
   - Validates raw exports and produces cleaned datasets in `data/processed/`.
   - Generates missing-field quality reports and deterministic train/validation split manifests.
   - Adds explicit placeholders for position-level readiness (`hasFen`, `hasPgn`, `positionTensorReady`).

3. `generate_graphs.py`
   - Produces publication-ready PNG charts in `img/`:
     - game outcome distribution
     - rating-change distribution
     - accuracy distribution
     - game-duration distribution
     - move-count distribution

4. `report_metrics.py`
   - Outputs machine-readable summaries in `data/reports/`:
     - dataset size
     - missing-field rates
     - class balance
     - per-user aggregates

5. `training.py` (orchestrator)
   - Runs export -> preprocess -> graph generation -> metrics reporting end-to-end.
   - This current phase is data/report focused while PGN/FEN storage is being introduced.

### Current Limitation

Full model training is intentionally gated on PGN/FEN persistence for move-by-move board-state reconstruction. Until position-level storage is available, these scripts provide robust analytics and reproducible data artifacts for reporting and pipeline validation.