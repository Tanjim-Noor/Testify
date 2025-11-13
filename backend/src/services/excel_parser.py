"""
Excel parsing service for question bulk import.

Parses an Excel (.xlsx) sheet with question rows and validates each row.
The parser returns a list of valid question dictionaries and per-row errors for reporting.
"""
from __future__ import annotations

import json
import logging
from typing import Dict, List, Optional, Tuple

import openpyxl

from src.schemas.question import ImportRowError

logger = logging.getLogger(__name__)


class QuestionExcelParser:
    """Parser to read questions from a given Excel workbook file.

    Expected headers (case-insensitive):
        title, description, complexity, type, options, correct_answers, max_score, tags

    The parser validates required fields and returns tuples of (valid_questions, errors).
    """

    REQUIRED_COLUMNS = {"title", "complexity", "type", "correct_answers", "max_score"}
    OPTIONAL_COLUMNS = {"description", "options", "tags"}
    VALID_COLUMNS = REQUIRED_COLUMNS.union(OPTIONAL_COLUMNS)

    def __init__(self, file_path: str):
        self.file_path = file_path

    def parse(self) -> Tuple[List[Dict], List[ImportRowError]]:
        """Parse Excel file and return tuple(valid_rows, errors).

        Args:
            file_path: Path to a .xlsx file

        Returns:
            Tuple of (list of valid dicts ready for DB insertion, list of ImportRowError)
        """
        valid_rows: List[Dict] = []
        errors: List[ImportRowError] = []
        try:
            workbook = openpyxl.load_workbook(self.file_path, read_only=True, data_only=True)
            sheet = workbook.active
        except Exception as e:
            logger.error("Failed to open Excel file: %s", e)
            raise

        # Read header row
        rows = list(sheet.iter_rows(values_only=True))
        if not rows or len(rows) < 1:
            raise ValueError("Excel file has no rows or header")

        header_row = [str(c).strip().lower() if c is not None else "" for c in rows[0]]
        header_index_map = {name: idx for idx, name in enumerate(header_row) if name}

        missing = self.REQUIRED_COLUMNS.difference(header_index_map.keys())
        if missing:
            raise ValueError(f"Missing required columns: {', '.join(sorted(missing))}")

        # Iterate data rows
        for idx, row in enumerate(rows[1:], start=2):
            try:
                row_data = {}
                for col_name, col_idx in header_index_map.items():
                    row_data[col_name] = row[col_idx] if col_idx < len(row) else None

                parsed, row_errors = self.validate_row(row_data, idx)
                if row_errors:
                    errors.append(ImportRowError(row_number=idx, errors=row_errors))
                else:
                    valid_rows.append(parsed)
            except Exception as e:
                errors.append(ImportRowError(row_number=idx, errors=[str(e)]))

        return valid_rows, errors

    def validate_row(self, row_data: Dict, row_number: int) -> Tuple[Optional[Dict], List[str]]:
        """Validate a single row and convert values into the expected dict.

        Returns parsed_data (or None) and list of errors for that row.
        """
        err_list: List[str] = []
        parsed: Dict = {}

        # Required: title
        title = row_data.get("title")
        if not title or str(title).strip() == "":
            err_list.append("Missing or empty 'title'")
        else:
            parsed["title"] = str(title).strip()

        # Optional description
        description = row_data.get("description")
        parsed["description"] = str(description).strip() if description not in (None, "") else None

        # complexity
        complexity = row_data.get("complexity")
        if not complexity or str(complexity).strip() == "":
            err_list.append("Missing or empty 'complexity'")
        else:
            parsed["complexity"] = str(complexity).strip()

        # type
        qtype = row_data.get("type")
        if not qtype or str(qtype).strip() == "":
            err_list.append("Missing or empty 'type'")
        else:
            qtype_str = str(qtype).strip().lower()
            if qtype_str not in {"single_choice", "multi_choice", "text", "image_upload"}:
                err_list.append(f"Invalid 'type': {qtype}")
            else:
                parsed["type"] = qtype_str

        # options - may be a JSON string or blank
        options_raw = row_data.get("options")
        options_val = None
        if options_raw not in (None, ""):
            try:
                if isinstance(options_raw, (list, tuple)):
                    options_val = [str(o) for o in options_raw]
                else:
                    options_val = json.loads(options_raw) if isinstance(options_raw, str) else [str(options_raw)]
                if not isinstance(options_val, list):
                    err_list.append("'options' must be a JSON list or comma-separated string")
                else:
                    parsed["options"] = [str(o).strip() for o in options_val]
            except Exception:
                # Try comma-separated fallback
                try:
                    parsed["options"] = [s.strip() for s in str(options_raw).split(",") if s.strip()]
                except Exception:
                    err_list.append("Unable to parse 'options' as JSON list or CSV")
        else:
            parsed["options"] = None

        # correct_answers - required for objective questions, but still present in required columns
        correct_raw = row_data.get("correct_answers")
        correct_val = None
        if correct_raw is None or (isinstance(correct_raw, str) and correct_raw.strip() == ""):
            # For text/image questions it may be allowed to be empty; further validation below
            correct_val = None
        else:
            try:
                if isinstance(correct_raw, (list, tuple)):
                    correct_val = [str(c).strip() for c in correct_raw]
                else:
                    correct_val = json.loads(correct_raw) if isinstance(correct_raw, str) else [str(correct_raw)]
                if not isinstance(correct_val, list):
                    err_list.append("'correct_answers' must be a JSON list or comma-separated string")
                else:
                    parsed["correct_answers"] = [str(c).strip() for c in correct_val]
            except Exception:
                # Fallback to CSV
                try:
                    parsed["correct_answers"] = [s.strip() for s in str(correct_raw).split(",") if s.strip()]
                except Exception:
                    err_list.append("Unable to parse 'correct_answers' as JSON list or CSV")

        # max_score - required and integer >= 1
        max_score_val = row_data.get("max_score")
        try:
            if max_score_val in (None, ""):
                err_list.append("Missing 'max_score'")
            else:
                max_score_int = int(max_score_val)
                if max_score_int < 1:
                    err_list.append("'max_score' must be >= 1")
                else:
                    parsed["max_score"] = max_score_int
        except Exception:
            err_list.append("'max_score' must be an integer")

        # tags - optional CSV
        tags_raw = row_data.get("tags")
        if tags_raw in (None, ""):
            parsed["tags"] = None
        else:
            if isinstance(tags_raw, (list, tuple)):
                parsed["tags"] = [str(t).strip() for t in tags_raw if str(t).strip()]
            else:
                parsed["tags"] = [s.strip() for s in str(tags_raw).split(",") if s.strip()]

        # Additional validation: options required for choice questions
        qtype_val = parsed.get("type")
        if qtype_val in ("single_choice", "multi_choice"):
            if not parsed.get("options") or len(parsed.get("options", [])) < 2:
                err_list.append("'options' is required and must be a list for choice questions")
            if not parsed.get("correct_answers"):
                err_list.append("'correct_answers' is required for objective questions")
        else:
            # For text/image, options and correct_answers may be omitted
            # If correct_answers present ensure it's a simple value or empty
            if parsed.get("correct_answers") is None:
                parsed["correct_answers"] = []

        if err_list:
            return None, err_list

        return parsed, []
