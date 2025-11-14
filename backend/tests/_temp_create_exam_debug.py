from datetime import datetime, timezone, timedelta
from types import SimpleNamespace
from uuid import uuid4
from src.services.exam_service import create_exam

class DummyDB:
    def add(self, obj): print('add called')
    def commit(self): print('commit called')
    def refresh(self, obj): print('refresh called')

payload = SimpleNamespace(model_dump=lambda exclude_none=True: {
    'title': 'A',
    'description':'desc',
    'start_time': datetime.now(timezone.utc) + timedelta(days=1),
    'end_time': datetime.now(timezone.utc) + timedelta(days=1),
    'duration_minutes': 60,
})
try:
    create_exam(DummyDB(), payload, uuid4())
except Exception as e:
    print('caught', type(e), e)
