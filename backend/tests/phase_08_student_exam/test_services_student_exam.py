from types import SimpleNamespace
from uuid import uuid4
from src.services import answer_service


class DummyQuery:
    def __init__(self, rows=None):
        self._rows = rows or []

    def filter(self, *args, **kwargs):
        return self

    def all(self):
        return self._rows

    def first(self):
        return self._rows[0] if self._rows else None


class DummyDB:
    def __init__(self, answers=None, questions=None):
        self._answers = answers or []
        self._questions = questions or []
        self.added = []
        self.committed = False

    def query(self, cls=None):
        if cls.__name__ == "StudentAnswer":
            return DummyQuery(self._answers)
        if cls.__name__ == "Question":
            return DummyQuery(self._questions)
        return DummyQuery([])

    def add(self, obj):
        self.added.append(obj)

    def commit(self):
        self.committed = True

    def rollback(self):
        pass


def test_get_student_answers_returns_mapping():
    qid = uuid4()
    ans = SimpleNamespace(question_id=qid, answer_value={"text": "hello"})
    db = DummyDB(answers=[ans])

    result = answer_service.get_student_answers(db, uuid4())
    assert qid in result
    assert result[qid]["text"] == "hello"


def test_bulk_save_answers_success(monkeypatch):
    qid = uuid4()
    # Make sure question exists
    fake_question = SimpleNamespace(id=qid)
    db = DummyDB(questions=[fake_question])

    answers = [SimpleNamespace(question_id=qid, answer_value={"text": "ok"})]

    saved = answer_service.bulk_save_answers(db, uuid4(), answers)
    assert saved == 1
    assert db.committed
