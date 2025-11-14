from datetime import datetime, timedelta, timezone
from pydantic import ValidationError

from src.schemas.exam import ExamCreate, ExamUpdate
import pytest


def test_exam_create_end_time_after_start():
    start = datetime.now(timezone.utc) + timedelta(days=1)
    end = start - timedelta(hours=1)
    with pytest.raises(ValidationError):
        ExamCreate(
            title="Trial",
            description="desc",
            start_time=start,
            end_time=end,
            duration_minutes=60,
        )


def test_exam_create_start_time_in_past():
    start = datetime.now(timezone.utc) - timedelta(days=1)
    end = datetime.now(timezone.utc) + timedelta(days=1)
    # Creating with a past `start_time` should be allowed (the service layer
    # enforces whether the exam is available to students). Ensure the Pydantic
    # schema accepts it rather than raising ValidationError.
    payload = ExamCreate(
        title="Past exam",
        description="desc",
        start_time=start,
        end_time=end,
        duration_minutes=45,
    )
    assert payload.start_time == start


def test_exam_update_all_optional():
    # Should not raise when fields are optional and valid
    payload = ExamUpdate(title="Changed")
    assert payload.title == "Changed"

    # If end_time before start_time in update where both provided
    start = datetime.now(timezone.utc) + timedelta(days=1)
    end = start - timedelta(minutes=5)
    with pytest.raises(ValidationError):
        ExamUpdate(start_time=start, end_time=end)
