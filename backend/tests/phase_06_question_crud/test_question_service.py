from src.services.question_service import bulk_create_questions


def test_bulk_create_no_data():
    assert bulk_create_questions([], None) == 0
