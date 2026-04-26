# AI Model Development

This folder contains the data and analytics pipeline used for the AI/dissertation reporting workflow. On the [ai-model-development.md](ai-model-development.md). Especialy [Data Contract](data-contract.md)

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| Python | Data processing and pipeline orchestration |
| pandas | Data cleaning and reporting |
| matplotlib / seaborn | Graph generation |
| numpy | Numeric operations |
| torch | Non-ML framework dependency |

## Project Structure

```text
AI-Model-Dev/
├── data/                     # Data storage for pipeline
│   ├── raw/                  # Raw exported game data (JSON/CSV)
│   ├── processed/            # Cleaned and processed datasets
│   └── reports/              # Generated reports and summaries
|
├── img/                      # Output charts and visualizations
|
├── data_export.py            # Script to export game data from API or JSON
├── preprocess_positions.py   # Cleans and processes raw data for Non-ML
├── generate_graphs.py        # Generates graphs and charts from data
├── report_metrics.py         # Computes and reports dataset metrics
├── training.py               # Main Non-ML training pipeline script
|
└── requirements.txt          # Python dependencies for the pipeline
```

## 🏗️ Installation
1. Install ``requirements.txt``
```bash
cd AI-Model-Dev
pip install -r requirements.txt
```

2. Run full pipeline (recommended)
```bash
python training.py --api-url <YOUR_RAILWAY_URL>/game
```

3. OR Run step-by-step
```bash
python data_export.py --api-url <YOUR_RAILWAY_URL>/game
python preprocess_positions.py
python generate_graphs.py
python report_metrics.py
```

4. You can also export from a local JSON file:
```bash
python data_export.py --input-json <path-to-games.json>
```

### Output Artifacts
After running, you should see:

* ``data/raw/``: normalized raw exports (games_raw_*.json/.csv) latest aliases
* ``data/processed/``: cleaned datasets, split manifest, quality report
* ``data/reports/``: metrics summary, class balance, per-user aggregates
* ``img/``: generated charts (``*.png``)

## Finally Integration
- Integration: [`integration/README.md`](../integration/README.md)