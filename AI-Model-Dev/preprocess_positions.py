"""Preprocess raw exported game records into ML-ready tabular artifacts.

This script currently builds game-level cleaned datasets and position placeholders.
True position tensors require PGN/FEN persistence in backend storage.

The preprocessing steps include:
- Normalization to a stable schema with consistent columns.
- Stable sorting by date and gameId for deterministic ordering.
- Type coercion for numeric fields.
- A deterministic train/validation split based on a stable hash of gameId.
- Generation of a quality report with missing field rates and position data readiness.

Output artifacts include:
- Cleaned CSV and JSON files with timestamped and "latest" versions.
- A placeholder CSV for position-level data tracking.
- A split manifest JSON describing the train/validation split.
- A quality report JSON summarizing dataset completeness and readiness.

Usage:
- python preprocess_positions.py --input-json path/to/games_raw.json --output-dir path/to/processed/ --val-ratio 0.2
"""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pandas as pd


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_INPUT_JSON = BASE_DIR / "data" / "raw" / "games_raw_latest.json"
DEFAULT_OUTPUT_DIR = BASE_DIR / "data" / "processed"


REQUIRED_COLUMNS = [
    "gameId",
    "date",
    "result",
    "termination",
    "moves",
    "duration",
    "myAccuracy",
    "opponentAccuracy",
    "ratingChange",
    "userRef",
]


def _stable_hash(value: str) -> float:
    digest = hashlib.sha256(value.encode("utf-8")).hexdigest()
    return int(digest[:8], 16) / 0xFFFFFFFF


def _read_json_records(input_json: Path) -> list[dict[str, Any]]:
    with input_json.open("r", encoding="utf-8") as f:
        payload = json.load(f)
    if not isinstance(payload, list):
        raise ValueError(f"Expected JSON array in {input_json}, got {type(payload).__name__}")
    return payload


def _missing_field_rates(df: pd.DataFrame, columns: list[str]) -> dict[str, float]:
    rates: dict[str, float] = {}
    total = max(len(df), 1)
    for col in columns:
        if col not in df.columns:
            rates[col] = 1.0
            continue
        null_count = df[col].isna().sum()
        rates[col] = float(null_count / total)
    return rates


def preprocess_records(input_json: Path, output_dir: Path, val_ratio: float = 0.2) -> dict[str, Any]:
    output_dir.mkdir(parents=True, exist_ok=True)
    records = _read_json_records(input_json)
    df = pd.DataFrame(records)

    # Ensure required columns exist, even if currently absent in raw source.
    for col in REQUIRED_COLUMNS:
        if col not in df.columns:
            df[col] = pd.NA

    # Stable ordering and light typing.
    df = df.sort_values(by=["date", "gameId"], na_position="last").reset_index(drop=True)
    numeric_cols = ["moves", "duration", "myAccuracy", "opponentAccuracy", "ratingChange", "myRating", "myNewRating"]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # Placeholder columns for future position-level training.
    df["hasFen"] = False
    df["hasPgn"] = False
    df["positionCount"] = 0
    df["positionTensorReady"] = False

    # Deterministic train/validation split by stable hash of gameId.
    split_scores = df["gameId"].fillna("").astype(str).apply(_stable_hash)
    df["split"] = split_scores.apply(lambda score: "val" if score < val_ratio else "train")

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    clean_csv = output_dir / f"games_clean_{timestamp}.csv"
    clean_json = output_dir / f"games_clean_{timestamp}.json"
    latest_clean_csv = output_dir / "games_clean_latest.csv"
    latest_clean_json = output_dir / "games_clean_latest.json"
    placeholder_csv = output_dir / f"positions_placeholder_{timestamp}.csv"
    latest_placeholder_csv = output_dir / "positions_placeholder_latest.csv"
    split_manifest_path = output_dir / f"split_manifest_{timestamp}.json"
    latest_split_manifest_path = output_dir / "split_manifest_latest.json"
    quality_report_path = output_dir / f"quality_report_{timestamp}.json"
    latest_quality_report_path = output_dir / "quality_report_latest.json"

    df.to_csv(clean_csv, index=False)
    df.to_json(clean_json, orient="records", indent=2)
    latest_clean_csv.write_text(clean_csv.read_text(encoding="utf-8"), encoding="utf-8")
    latest_clean_json.write_text(clean_json.read_text(encoding="utf-8"), encoding="utf-8")

    placeholder_df = df[["gameId", "date", "result", "positionCount", "hasFen", "hasPgn", "positionTensorReady"]].copy()
    placeholder_df.to_csv(placeholder_csv, index=False)
    latest_placeholder_csv.write_text(placeholder_csv.read_text(encoding="utf-8"), encoding="utf-8")

    split_manifest = {
        "generatedAtUtc": timestamp,
        "trainCount": int((df["split"] == "train").sum()),
        "valCount": int((df["split"] == "val").sum()),
        "validationRatio": val_ratio,
        "cleanCsvPath": str(clean_csv),
        "cleanJsonPath": str(clean_json),
    }
    quality_report = {
        "generatedAtUtc": timestamp,
        "recordCount": int(len(df)),
        "requiredColumns": REQUIRED_COLUMNS,
        "missingFieldRates": _missing_field_rates(df, REQUIRED_COLUMNS),
        "positionDataReadiness": {
            "fenAvailableRate": float(df["hasFen"].mean()) if len(df) else 0.0,
            "pgnAvailableRate": float(df["hasPgn"].mean()) if len(df) else 0.0,
        },
    }

    with split_manifest_path.open("w", encoding="utf-8") as f:
        json.dump(split_manifest, f, indent=2)
    with quality_report_path.open("w", encoding="utf-8") as f:
        json.dump(quality_report, f, indent=2)

    latest_split_manifest_path.write_text(split_manifest_path.read_text(encoding="utf-8"), encoding="utf-8")
    latest_quality_report_path.write_text(quality_report_path.read_text(encoding="utf-8"), encoding="utf-8")

    return {
        "cleanCsv": str(latest_clean_csv),
        "cleanJson": str(latest_clean_json),
        "placeholderCsv": str(latest_placeholder_csv),
        "splitManifest": str(latest_split_manifest_path),
        "qualityReport": str(latest_quality_report_path),
        "recordCount": int(len(df)),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Preprocess raw game exports for ML/reporting.")
    parser.add_argument("--input-json", type=Path, default=DEFAULT_INPUT_JSON, help="Path to raw exported JSON records.")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR, help="Directory for processed artifacts.")
    parser.add_argument("--val-ratio", type=float, default=0.2, help="Validation split ratio in [0,1].")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if args.val_ratio < 0 or args.val_ratio > 1:
        raise ValueError("--val-ratio must be between 0 and 1")
    result = preprocess_records(args.input_json, args.output_dir, args.val_ratio)
    print(f"Preprocessing completed: {result['recordCount']} records")
    print(f"Clean dataset: {result['cleanCsv']}")
    print(f"Quality report: {result['qualityReport']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())