# AI Model Development

This folder contains the data and analytics pipeline used for the AI/dissertation reporting workflow. On the [ai-model-development.md](ai-model-development.md)

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| Python | Data processing and pipeline orchestration |
| pandas | Data cleaning and reporting |
| matplotlib / seaborn | Graph generation |
| numpy | Numeric operations |
| torch | ML framework dependency |

## Project Structure

```text
AI-Model-Dev/
├── data/
│   ├── raw/
│   ├── processed/
│   └── reports/
├── img/
├── data_export.py
├── preprocess_positions.py
├── generate_graphs.py
├── report_metrics.py
├── training.py
└── requirements.txt
```

## Installation
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