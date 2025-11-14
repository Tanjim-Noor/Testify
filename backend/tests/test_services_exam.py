from types import SimpleNamespace
from typing import cast
from sqlalchemy.orm import Session
from src.schemas.exam import ExamCreate
from uuid import uuid4
from datetime import datetime, timezone, timedelta

import pytest

from src.services import exam_service
from src.schemas.exam import ExamCreate


class DummyDB:
    def __init__(self):
        self.added = []
        self.committed = False
        self.refreshed = []

    def add(self, obj):
        self.added.append(obj)

    def commit(self):
        self.committed = True

    def refresh(self, obj):
        # mimic setting id
        obj.id = uuid4()
        self.refreshed.append(obj)


def make_payload(start_offset_hours=24, duration=60):
    now = datetime.now(timezone.utc)
    return SimpleNamespace(
        model_dump=lambda exclude_none=True: {
            "title": "Service Test",
            "description": "Service exam",
            "start_time": now + timedelta(hours=start_offset_hours),
            "end_time": now + timedelta(hours=start_offset_hours + duration / 60 + 1),
            "duration_minutes": duration,
        }
    )


def test_create_exam_success():
    db = DummyDB()
    admin_id = uuid4()
    payload = make_payload()
    created = exam_service.create_exam(cast(Session, db), cast(ExamCreate, payload), admin_id)
    assert created is not None
    assert db.committed
    assert created.title == "Service Test"


def test_create_exam_invalid_time_range():
    db = DummyDB()
    admin_id = uuid4()
    payload = make_payload(start_offset_hours=24)
    # create bad payload: end <= start
    start = datetime.now(timezone.utc) + timedelta(days=1)
    payload = SimpleNamespace(model_dump=lambda exclude_none=True: {
        "title": "Bad Service Test",
        "description": "Service exam",
        "start_time": start,
        "end_time": start,  # intentionally equal to trigger the error
        "duration_minutes": 60,
    })

    with pytest.raises(ValueError):
        exam_service.create_exam(cast(Session, db), cast(ExamCreate, payload), admin_id)
