#!/usr/bin/env bash
set -euo pipefail

# Run entire suite
printf '\n[1/4] Running complete suite...\n'
pytest -vv

# Run suite with coverage reports
printf '\n[2/4] Running suite with coverage...\n'
pytest -vv --cov=src --cov-report=html

# Run a single file (auth tests)
printf '\n[3/4] Running auth tests only...\n'
pytest -vv tests/comprehensive\ testing/test_auth.py

# Run tests matching keyword
printf '\n[4/4] Running grading-focused tests...\n'
pytest -vv -k "test_grade"
