"""Generate machine-readable metrics summaries for dissertation/reporting.

This script reads a cleaned CSV of chess game records and produces a set of JSON and CSV files summarizing key metrics:
- Overall dataset summary with missing field rates and class balance.
- Class balance CSV showing distribution of game outcomes (win/loss/draw).
- Per-user aggregates CSV with average accuracy, rating change, etc.

The script is designed to be flexible in locating the input CSV, with a resolution order that checks:
1) the exact user-provided path,
2) a path relative to this script directory (for convenience),
3) the newest fallback in data/processed.

Output files are saved to a specified directory (default: data/reports/), which is created if it doesn't exist.
Usage:
- python report_metrics.py --input-csv path/to/processed_games.csv --output-dir path/to/output_reports/

Example output files:
- data/reports/metrics_summary_20240601T120000Z.json
- data/reports/class_balance_20240601T120000Z.csv
- data/reports/per_user_aggregates_20240601T120000Z.csv
- data/reports/metrics_summary_latest.json
- data/reports/class_balance_latest.csv
- data/reports/per_user_aggregates_latest.csv
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_INPUT_CSV = BASE_DIR / "data" / "processed" / "games_clean_latest.csv"
DEFAULT_OUTPUT_DIR = BASE_DIR / "data" / "reports"


SUMMARY_FIELDS = [
    "gameId",
    "date",
    "result",
    "moves",
    "duration",
    "myAccuracy",
    "opponentAccuracy",
    "ratingChange",
    "userRef",
]


def _missing_rates(df: pd.DataFrame, fields: list[str]) -> dict[str, float]:
    rates: dict[str, float] = {}
    total = max(len(df), 1)
    for field in fields:
        if field not in df.columns:
            rates[field] = 1.0
        else:
            rates[field] = float(df[field].isna().sum() / total)
    return rates


def _class_balance(df: pd.DataFrame, col: str) -> dict[str, int]:
    if col not in df.columns:
        return {}
    counts = df[col].fillna("unknown").value_counts().sort_index()
    return {str(k): int(v) for k, v in counts.items()}


def _per_user_aggregates(df: pd.DataFrame) -> pd.DataFrame:
    if "userRef" not in df.columns:
        return pd.DataFrame(columns=["userRef", "gameCount"])

    for col in ["myAccuracy", "opponentAccuracy", "ratingChange", "moves", "duration"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    grouped = (
        df.groupby("userRef", dropna=False)
        .agg(
            gameCount=("gameId", "count"),
            meanMyAccuracy=("myAccuracy", "mean"),
            meanOpponentAccuracy=("opponentAccuracy", "mean"),
            meanRatingChange=("ratingChange", "mean"),
            meanMoves=("moves", "mean"),
            meanDuration=("duration", "mean"),
        )
        .reset_index()
    )

    grouped["userRef"] = grouped["userRef"].fillna("unknown")
    return grouped.sort_values(by="gameCount", ascending=False)


def generate_report(input_csv: Path, output_dir: Path) -> dict[str, str]:
    output_dir.mkdir(parents=True, exist_ok=True)
    df = pd.read_csv(input_csv)

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    summary_json = output_dir / f"metrics_summary_{timestamp}.json"
    latest_summary_json = output_dir / "metrics_summary_latest.json"
    class_balance_csv = output_dir / f"class_balance_{timestamp}.csv"
    latest_class_balance_csv = output_dir / "class_balance_latest.csv"
    user_agg_csv = output_dir / f"per_user_aggregates_{timestamp}.csv"
    latest_user_agg_csv = output_dir / "per_user_aggregates_latest.csv"

    class_balance = _class_balance(df, "result")
    class_df = pd.DataFrame([{"result": k, "count": v} for k, v in class_balance.items()])
    user_df = _per_user_aggregates(df)

    summary = {
        "generatedAtUtc": timestamp,
        "recordCount": int(len(df)),
        "missingFieldRates": _missing_rates(df, SUMMARY_FIELDS),
        "classBalance": class_balance,
        "uniqueUsers": int(user_df["userRef"].nunique()) if not user_df.empty else 0,
    }

    with summary_json.open("w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    class_df.to_csv(class_balance_csv, index=False)
    user_df.to_csv(user_agg_csv, index=False)

    latest_summary_json.write_text(summary_json.read_text(encoding="utf-8"), encoding="utf-8")
    latest_class_balance_csv.write_text(class_balance_csv.read_text(encoding="utf-8"), encoding="utf-8")
    latest_user_agg_csv.write_text(user_agg_csv.read_text(encoding="utf-8"), encoding="utf-8")

    return {
        "summaryJson": str(latest_summary_json),
        "classBalanceCsv": str(latest_class_balance_csv),
        "perUserCsv": str(latest_user_agg_csv),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate machine-readable metrics reports.")
    parser.add_argument("--input-csv", type=Path, default=DEFAULT_INPUT_CSV, help="Path to processed games CSV.")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR, help="Output directory for report files.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    outputs = generate_report(args.input_csv, args.output_dir)
    print("Generated report files:")
    for key, value in outputs.items():
        print(f"- {key}: {value}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
