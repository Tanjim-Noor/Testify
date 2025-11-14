from src.services import grading_service


def test_grade_single_choice_correct():
    is_correct, score = grading_service.grade_single_choice({"answer": "A"}, ["A"])
    assert is_correct is True
    assert score == 1.0


def test_grade_single_choice_case_insensitive():
    is_correct, score = grading_service.grade_single_choice({"answer": "a"}, ["A"])
    assert is_correct is True
    assert score == 1.0


def test_grade_single_choice_empty():
    is_correct, score = grading_service.grade_single_choice({}, ["A"])
    assert is_correct is False
    assert score == 0.0


def test_grade_multi_choice_exact_match():
    is_correct, score = grading_service.grade_multi_choice({"answers": ["A", "C"]}, ["A", "C"], 2)
    assert is_correct is True
    assert score == 2.0


def test_grade_multi_choice_order_independent():
    is_correct, score = grading_service.grade_multi_choice({"answers": ["C", "A"]}, ["A", "C"], 3)
    assert is_correct is True
    assert score == 3.0


def test_grade_multi_choice_extra_wrong():
    is_correct, score = grading_service.grade_multi_choice({"answers": ["A", "B", "C"]}, ["A", "C"], 2)
    assert is_correct is False
    assert score == 0.0


def test_grade_question_text_returns_none():
    from src.models.question import Question

    q = Question(title="T", description=None, complexity="c", type="text", options=None, correct_answers=None, max_score=1)
    is_correct, score = grading_service.grade_question(q, {"text": "answer"})
    assert is_correct is None
    assert score is None
