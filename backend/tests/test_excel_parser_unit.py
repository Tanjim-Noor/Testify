from pathlib import Path
from openpyxl import Workbook
from src.services.excel_parser import QuestionExcelParser


def create_workbook(path: Path, rows: list[list]):
    wb = Workbook()
    sheet = wb.active
    for row in rows:
        sheet.append(row)
    wb.save(path)


def test_parser_valid_rows(tmp_path: Path):
    file = tmp_path / "valid_questions.xlsx"
    rows = [
        ["title", "description", "complexity", "type", "options", "correct_answers", "max_score", "tags"],
        ["What is 2+2?", "Simple addition", "easy", "single_choice", '["A","B","C"]', '["B"]', 1, "math"],
        ["Explain gravity", "Open ended", "medium", "text", None, None, 2, "physics"],
    ]
    create_workbook(file, rows)
    parser = QuestionExcelParser(str(file))
    valid, errors = parser.parse()
    assert len(valid) == 2
    assert len(errors) == 0
    assert valid[0]["title"] == "What is 2+2?"
    assert valid[1]["type"] == "text"


def test_parser_with_errors(tmp_path: Path):
    file = tmp_path / "invalid_questions.xlsx"
    rows = [
        ["title", "description", "complexity", "type", "options", "correct_answers", "max_score", "tags"],
        [None, "Missing title", "easy", "single_choice", '["A","B"]', '["A"]', 1, "math"],
        ["Invalid type", "Bad type", "easy", "unknown", None, None, 1, "test"],
        ["Bad score", "Negative", "easy", "text", None, None, 0, "test"],
    ]
    create_workbook(file, rows)
    parser = QuestionExcelParser(str(file))
    valid, errors = parser.parse()
    assert len(valid) == 0
    assert len(errors) == 3
    # Check error messages
    messages = [e.errors for e in errors]
    assert any(any("Missing or empty 'title'" in m for m in errs) for errs in messages)
    assert any(any("Invalid 'type'" in m for m in errs) for errs in messages)
    assert any(any("'max_score' must be >= 1" in m or "'max_score' must be an integer" in m for m in errs) for errs in messages)
