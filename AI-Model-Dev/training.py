"""Pipeline orchestrator for AI-Model-Dev report-first implementation.

This script chains:
1) data export,
2) preprocessing,
3) graph generation,
4) metrics report generation.

It is intentionally focused on data/analytics artifacts while PGN/FEN
collection is being implemented in backend storage.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from data_export import export_records, load_games_from_api, load_games_from_json
from generate_graphs import generate_graphs
from preprocess_positions import preprocess_records
from report_metrics import generate_report


BASE_DIR = Path(__file__).resolve().parent


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run end-to-end data + graph + report pipeline.")
    parser.add_argument("--input-json", type=Path, help="Path to local source game JSON array.")
    parser.add_argument("--api-url", type=str, help="Games API endpoint that returns a JSON array.")
    parser.add_argument("--raw-dir", type=Path, default=BASE_DIR / "data" / "raw", help="Output directory for raw exports.")
    parser.add_argument("--processed-dir", type=Path, default=BASE_DIR / "data" / "processed", help="Output directory for processed artifacts.")
    parser.add_argument("--reports-dir", type=Path, default=BASE_DIR / "data" / "reports", help="Output directory for metrics reports.")
    parser.add_argument("--img-dir", type=Path, default=BASE_DIR / "img", help="Output directory for generated graphs.")
    parser.add_argument("--val-ratio", type=float, default=0.2, help="Validation split ratio in [0,1].")
    parser.add_argument("--limit", type=int, default=0, help="Optional cap on number of records (0 = all).")
    return parser.parse_args()


def _load_source_records(input_json: Path | None, api_url: str | None) -> list[dict]:
    if not input_json and not api_url:
        raise ValueError("Provide at least one source with --input-json or --api-url")

    records: list[dict] = []
    if input_json:
        records.extend(load_games_from_json(input_json))
    if api_url:
        records.extend(load_games_from_api(api_url))
    return records


def main() -> int:
    args = parse_args()

    records = _load_source_records(args.input_json, args.api_url)
    if args.limit > 0:
        records = records[: args.limit]

    export_manifest = export_records(records, args.raw_dir)
    preprocessed = preprocess_records(Path(export_manifest["latestJsonPath"]), args.processed_dir, args.val_ratio)
    graph_paths = generate_graphs(Path(preprocessed["cleanCsv"]), args.img_dir)
    report_paths = generate_report(Path(preprocessed["cleanCsv"]), args.reports_dir)

    print("\nPipeline completed successfully.")
    print(f"Raw export: {export_manifest['latestJsonPath']}")
    print(f"Processed CSV: {preprocessed['cleanCsv']}")
    print(f"Graphs generated: {len(graph_paths)}")
    for graph in graph_paths:
        print(f"- {graph}")
    print("Report artifacts:")
    for key, path in report_paths.items():
        print(f"- {key}: {path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
