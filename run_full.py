#!/usr/bin/env python3
"""Full scraper run: index all sources then download all files.

Equivalent to running:
    python -m src.cli run

kept as a convenience entry point.
"""
from src.cli import cli

if __name__ == "__main__":
    cli(["run"])
