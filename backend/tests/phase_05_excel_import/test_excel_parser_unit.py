from datetime import datetime, timezone
from src.services.excel_parser import QuestionExcelParser


def test_excel_parse_minimal():
    # placeholder: ensure parser can be constructed with a path
    parser = QuestionExcelParser("tests/test_data/sample.xlsx")
    assert parser is not None
