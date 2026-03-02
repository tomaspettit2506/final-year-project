"""Export chess game data into normalized, versioned raw datasets.

This script supports either:
1) local JSON input (array of game records), or
2) pulling data from a backend games API endpoint.

Output:
- JSON and CSV files with deterministic ordering.
- A machine-readable manifest JSON describing the export.
"""

from __future__ import annotations

import argparse
import csv
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import URLError
from urllib.request import urlopen


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_OUTPUT_DIR = BASE_DIR / "data" / "raw"


def _safe_float(value: Any) -> float | None:
    try:
        if value is None or value == "":
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def _safe_int(value: Any) -> int | None:
    try:
        if value is None or value == "":
            return None
        return int(value)
    except (TypeError, ValueError):
        return None


def normalize_game_record(record: dict[str, Any]) -> dict[str, Any]:
    """Normalize a single backend game record to a stable export schema."""
    game_id = record.get("_id") or record.get("gameId")
    user_ref = record.get("firebaseUid") or record.get("userId")

    return {
        "gameId": game_id,
        "date": record.get("date"),
        "result": record.get("result"),
        "termination": record.get("termination"),
        "isRated": bool(record.get("isRated", False)),
        "timeControl": _safe_int(record.get("timeControl")),
        "moves": _safe_int(record.get("moves")),
        "duration": _safe_int(record.get("duration")),
        "playerColor": record.get("playerColor"),
        "opponent": record.get("opponent"),
        "myRating": _safe_float(record.get("myRating")),
        "myNewRating": _safe_float(record.get("myNewRating")),
        "ratingChange": _safe_float(record.get("ratingChange")),
        "opponentRating": _safe_float(record.get("opponentRating")),
        "opponentNewRating": _safe_float(record.get("opponentNewRating")),
        "opponentRatingChange": _safe_float(record.get("opponentRatingChange")),
        "myAccuracy": _safe_float(record.get("myAccuracy")),
        "opponentAccuracy": _safe_float(record.get("opponentAccuracy")),
        "userRef": user_ref,
        "rawSource": "games_api_or_json",
    }


def _deterministic_sort_key(item: dict[str, Any]) -> tuple[str, str]:
    return (str(item.get("date") or ""), str(item.get("gameId") or ""))


def load_games_from_json(input_path: Path) -> list[dict[str, Any]]:
    with input_path.open("r", encoding="utf-8") as f:
        payload = json.load(f)

    if not isinstance(payload, list):
        raise ValueError(f"Expected JSON array in {input_path}, received {type(payload).__name__}")

    return payload


def load_games_from_api(api_url: str) -> list[dict[str, Any]]:
    try:
        with urlopen(api_url) as response:  # nosec B310 - intended for controlled project endpoints
            payload = json.loads(response.read().decode("utf-8"))
    except URLError as exc:
        raise RuntimeError(f"Unable to fetch data from API URL: {api_url}") from exc

    if not isinstance(payload, list):
        raise ValueError(f"Expected API to return a JSON array, received {type(payload).__name__}")

    return payload


def export_records(records: list[dict[str, Any]], output_dir: Path, stem: str = "games_raw") -> dict[str, Any]:
    output_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    json_path = output_dir / f"{stem}_{timestamp}.json"
    csv_path = output_dir / f"{stem}_{timestamp}.csv"
    latest_json_path = output_dir / f"{stem}_latest.json"
    latest_csv_path = output_dir / f"{stem}_latest.csv"
    manifest_path = output_dir / f"{stem}_{timestamp}.manifest.json"
    latest_manifest_path = output_dir / f"{stem}_latest.manifest.json"

    normalized = [normalize_game_record(r) for r in records]
    normalized.sort(key=_deterministic_sort_key)

    with json_path.open("w", encoding="utf-8") as f:
        json.dump(normalized, f, indent=2)

    fieldnames = list(normalized[0].keys()) if normalized else []
    with csv_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        if fieldnames:
            writer.writeheader()
            writer.writerows(normalized)

    latest_json_path.write_text(json_path.read_text(encoding="utf-8"), encoding="utf-8")
    latest_csv_path.write_text(csv_path.read_text(encoding="utf-8"), encoding="utf-8")

    manifest = {
        "generatedAtUtc": timestamp,
        "recordCount": len(normalized),
        "schemaVersion": "1.0.0",
        "jsonPath": str(json_path),
        "csvPath": str(csv_path),
        "latestJsonPath": str(latest_json_path),
        "latestCsvPath": str(latest_csv_path),
        "fields": fieldnames,
    }

    with manifest_path.open("w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    latest_manifest_path.write_text(manifest_path.read_text(encoding="utf-8"), encoding="utf-8")

    return manifest


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Export normalized chess game records.")
    parser.add_argument("--input-json", type=Path, help="Path to local JSON array of game records.")
    parser.add_argument("--api-url", type=str, help="Games API endpoint returning a JSON array.")
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR, help="Directory for export artifacts.")
    parser.add_argument("--limit", type=int, default=0, help="Optional max records to keep after sorting (0 = all).")
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    if not args.input_json and not args.api_url:
        raise ValueError("Provide at least one source: --input-json or --api-url")

    source_records: list[dict[str, Any]] = []
    if args.input_json:
        source_records.extend(load_games_from_json(args.input_json))
    if args.api_url:
        source_records.extend(load_games_from_api(args.api_url))

    source_records.sort(key=_deterministic_sort_key)
    if args.limit > 0:
        source_records = source_records[: args.limit]

    manifest = export_records(source_records, args.output_dir)
    print(f"Export completed: {manifest['recordCount']} records")
    print(f"Latest JSON: {manifest['latestJsonPath']}")
    print(f"Latest CSV:  {manifest['latestCsvPath']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())