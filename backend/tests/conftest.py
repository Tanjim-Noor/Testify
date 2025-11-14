"""
Pytest configuration for tests.

This conftest adds the `backend` directory to sys.path so tests can import
the application package `src` even when pytest is run from the repository root.
"""
from __future__ import annotations

import os
import sys


def _add_backend_to_path():
    # Insert the project 'backend' folder at the start of sys.path so 'src' is importable
    this_dir = os.path.dirname(__file__)
    backend_root = os.path.abspath(os.path.join(this_dir))
    if backend_root not in sys.path:
        sys.path.insert(0, backend_root)


_add_backend_to_path()
