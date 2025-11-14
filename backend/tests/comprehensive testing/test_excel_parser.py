"""Excel parser tests exercising valid and invalid import scenarios."""
from __future__ import annotations

from pathlib import Path

import pytest
from openpyxl import Workbook

from src.services.excel_parser import QuestionExcelParser
from src.services import question_service

HEADER = [
    "title",
    "description",
    "complexity",
    "type",
    "options",
    "correct_answers",
    "max_score",
    "tags",
]


def _write_workbook(tmp_path, name: str, rows: list[list]):
    path = Path(tmp_path) / name
    wb = Workbook()
    sheet = wb.active
    sheet.append(HEADER)
    for row in rows:
        sheet.append(row)
    wb.save(path)
    return path


class TestExcelParsing:
    def test_parse_valid_excel(self, tmp_path):
        rows = [
            ["SC Question", "desc", "easy", "single_choice", '["A","B","C"]', '["B"]', 1, "math"],
            ["MC Question", "desc", "medium", "multi_choice", '["A","B","C"]', '["A","C"]', 2, "logic"],
            ["Text Question", "desc", "hard", "text", "", "", 5, "essay"],
        ]
        file_path = _write_workbook(tmp_path, "valid.xlsx", rows)

        parser = QuestionExcelParser(str(file_path))
        valid_rows, errors = parser.parse()

        assert len(valid_rows) == 3
        assert errors == []

    def test_parse_invalid_json_options(self, tmp_path):
        rows = [["Bad options", "desc", "easy", "single_choice", "not-json", '["A"]', 1, "math"]]
        file_path = _write_workbook(tmp_path, "invalid_options.xlsx", rows)

        parser = QuestionExcelParser(str(file_path))
        valid_rows, errors = parser.parse()

        assert len(valid_rows) == 0
        assert errors[0].row_number == 2

    def test_parse_missing_required_fields(self, tmp_path):
        rows = [["", "desc", "", "single_choice", '["A","B"]', '["A"]', "", "math"]]
        file_path = _write_workbook(tmp_path, "missing_fields.xlsx", rows)

        parser = QuestionExcelParser(str(file_path))
        valid_rows, errors = parser.parse()

        assert len(valid_rows) == 0
        assert "Missing or empty 'title'" in errors[0].errors[0]

    def test_parse_invalid_question_type(self, tmp_path):
        rows = [["Bad type", "desc", "easy", "unsupported", '["A","B"]', '["A"]', 1, "math"]]
        file_path = _write_workbook(tmp_path, "invalid_type.xlsx", rows)

        parser = QuestionExcelParser(str(file_path))
        valid_rows, errors = parser.parse()

        assert len(valid_rows) == 0
        assert "Invalid 'type'" in errors[0].errors[0]

    def test_parse_empty_file(self, tmp_path):
        path = Path(tmp_path) / "empty.xlsx"
        wb = Workbook()
        wb.save(path)

        with pytest.raises(ValueError):
            QuestionExcelParser(str(path)).parse()


class TestExcelImportFlow:
    def test_bulk_import_success(self, tmp_path, db_session):
        rows = [["SC Question", "desc", "easy", "single_choice", '["A","B"]', '["B"]', 1, "math"]]
        file_path = _write_workbook(tmp_path, "bulk.xlsx", rows)

        result = question_service.process_excel_import(str(file_path), db_session)

        assert result.success_count == 1
        assert result.error_count == 0

    def test_bulk_import_partial_errors(self, tmp_path, db_session):
        rows = [
            ["Valid", "desc", "easy", "single_choice", '["A","B"]', '["B"]', 1, "math"],
            ["Missing Score", "desc", "easy", "single_choice", '["A","B"]', '["B"]', "", "math"],
        ]
        file_path = _write_workbook(tmp_path, "partial.xlsx", rows)

        result = question_service.process_excel_import(str(file_path), db_session)

        assert result.success_count == 1
        assert result.error_count == 1