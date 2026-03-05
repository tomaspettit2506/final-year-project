"""Generate core analytics graphs from processed chess game data.

This script reads a cleaned CSV of chess game records and produces a set of PNG charts visualizing key metrics:
- Outcome distribution (win/loss/draw)
- Rating change distribution
- Accuracy distribution
- Game duration distribution
- Move count distribution

The script is designed to be flexible in locating the input CSV, with a resolution order that checks:
1) the exact user-provided path,
2) a path relative to this script directory (for convenience),
3) the newest fallback in data/processed.

Output PNG files are saved to a specified directory (default: img/), which is created if it doesn't exist.
Usage:
- python generate_graphs.py --input-csv path/to/processed_games.csv --image-dir path/to/output_images/

"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_INPUT_CSV = BASE_DIR / "data" / "processed" / "games_clean_latest.csv"
DEFAULT_IMAGE_DIR = BASE_DIR / "img"


def _resolve_input_csv(input_csv: Path) -> Path:
	"""Resolve the best available input CSV path.

	Resolution order:
	1) exact user-provided path,
	2) path relative to this script directory (for convenience),
	3) newest fallback in data/processed.
	"""

	candidate = input_csv.expanduser()
	if candidate.exists():
		return candidate

	if not candidate.is_absolute():
		relative_to_script = (BASE_DIR / candidate).resolve()
		if relative_to_script.exists():
			return relative_to_script

	processed_dir = BASE_DIR / "data" / "processed"
	if processed_dir.exists():
		for pattern in ["games_clean_latest.csv", "games_clean_*.csv", "*.csv"]:
			matches = sorted(processed_dir.glob(pattern), key=lambda p: p.stat().st_mtime, reverse=True)
			if matches:
				return matches[0]

	raise FileNotFoundError(
		"Could not find an input CSV for graph generation. "
		f"Checked: '{input_csv}'. "
		"Expected processed data in 'AI-Model-Dev/data/processed/'. "
		"Run preprocessing/pipeline first, or pass --input-csv explicitly."
	)


def _ensure_numeric(df: pd.DataFrame, columns: list[str]) -> pd.DataFrame:
	for col in columns:
		if col in df.columns:
			df[col] = pd.to_numeric(df[col], errors="coerce")
	return df


def _save_plot(path: Path) -> None:
	plt.tight_layout()
	plt.savefig(path, dpi=160)
	plt.close()


def generate_graphs(input_csv: Path, image_dir: Path) -> list[Path]:
	image_dir.mkdir(parents=True, exist_ok=True)
	resolved_input_csv = _resolve_input_csv(input_csv)
	df = pd.read_csv(resolved_input_csv)
	df = _ensure_numeric(df, ["ratingChange", "myAccuracy", "duration", "moves"])

	output_files: list[Path] = []

	# 1) Outcome distribution
	if "result" in df.columns:
		plt.figure(figsize=(8, 5))
		counts = df["result"].fillna("unknown").value_counts().sort_index()
		counts.plot(kind="bar", color="#4c78a8")
		plt.title("Game Outcome Distribution")
		plt.xlabel("Result")
		plt.ylabel("Count")
		out = image_dir / "game_outcome_distribution.png"
		_save_plot(out)
		output_files.append(out)

	# 2) Rating change distribution
	if "ratingChange" in df.columns:
		plt.figure(figsize=(8, 5))
		df["ratingChange"].dropna().plot(kind="hist", bins=25, color="#f58518")
		plt.title("Rating Change Distribution")
		plt.xlabel("Rating Change")
		plt.ylabel("Frequency")
		out = image_dir / "rating_change_distribution.png"
		_save_plot(out)
		output_files.append(out)

	# 3) Accuracy distribution
	if "myAccuracy" in df.columns:
		plt.figure(figsize=(8, 5))
		df["myAccuracy"].dropna().plot(kind="hist", bins=25, color="#54a24b")
		plt.title("Player Accuracy Distribution")
		plt.xlabel("Accuracy")
		plt.ylabel("Frequency")
		out = image_dir / "accuracy_distribution.png"
		_save_plot(out)
		output_files.append(out)

	# 4) Duration distribution
	if "duration" in df.columns:
		plt.figure(figsize=(8, 5))
		df["duration"].dropna().plot(kind="hist", bins=25, color="#e45756")
		plt.title("Game Duration Distribution")
		plt.xlabel("Duration (seconds)")
		plt.ylabel("Frequency")
		out = image_dir / "game_duration_distribution.png"
		_save_plot(out)
		output_files.append(out)

	# 5) Move count distribution
	if "moves" in df.columns:
		plt.figure(figsize=(8, 5))
		df["moves"].dropna().plot(kind="hist", bins=25, color="#72b7b2")
		plt.title("Move Count Distribution")
		plt.xlabel("Moves")
		plt.ylabel("Frequency")
		out = image_dir / "move_count_distribution.png"
		_save_plot(out)
		output_files.append(out)

	return output_files


def parse_args() -> argparse.Namespace:
	parser = argparse.ArgumentParser(description="Generate analytics plots from processed games dataset.")
	parser.add_argument("--input-csv", type=Path, default=DEFAULT_INPUT_CSV, help="Path to processed games CSV.")
	parser.add_argument("--image-dir", type=Path, default=DEFAULT_IMAGE_DIR, help="Output directory for PNG charts.")
	return parser.parse_args()


def main() -> int:
	args = parse_args()
	try:
		outputs = generate_graphs(args.input_csv, args.image_dir)
	except FileNotFoundError as exc:
		print(f"Error: {exc}", file=sys.stderr)
		return 1

	print("Generated graph files:")
	for path in outputs:
		print(f"- {path}")
	return 0


if __name__ == "__main__":
	raise SystemExit(main())