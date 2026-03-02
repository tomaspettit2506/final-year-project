"""Generate core analytics graphs from processed chess game data."""

from __future__ import annotations

import argparse
from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_INPUT_CSV = BASE_DIR / "data" / "processed" / "games_clean_latest.csv"
DEFAULT_IMAGE_DIR = BASE_DIR / "img"


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
	df = pd.read_csv(input_csv)
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
	outputs = generate_graphs(args.input_csv, args.image_dir)
	print("Generated graph files:")
	for path in outputs:
		print(f"- {path}")
	return 0


if __name__ == "__main__":
	raise SystemExit(main())