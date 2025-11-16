from typing import List
from sqlalchemy.orm import Session
from src.models.question import Question
from src.seeds.seeders.base_seeder import BaseSeeder
from src.seeds.data.questions import SAMPLE_QUESTIONS
from src.seeds import seed_tracker
from src.services.question_service import create_question
from src.schemas.question import QuestionCreate
import logging

logger = logging.getLogger(__name__)


class QuestionsSeeder(BaseSeeder):
    """Seed questions. Skips rows when a title already exists."""

    def seed(self) -> List[str]:
        created = []
        for q in SAMPLE_QUESTIONS:
            # idempotency: skip identical title
            existing = self.db.query(Question).filter(Question.title == q.get("title")).first()
            if existing:
                logger.info("Skipping existing question: %s", q.get("title"))
                continue
            try:
                # Use pydantic schema to validate seed data
                payload = QuestionCreate(**q)
                obj = create_question(self.db, payload)
                created.append(str(obj.id))
            except Exception as e:
                logger.exception("Failed creating question %s: %s", q.get("title"), e)
        self.created_ids = created
        if created:
            seed_tracker.mark_seeded("questions", created)
        return created

    def clean(self) -> int:
        ids = seed_tracker.get_seeded_ids("questions")
        if not ids:
            return 0
        q = self.db.query(Question).filter(Question.id.in_(ids))
        num = q.count()
        q.delete(synchronize_session=False)
        self.db.commit()
        seed_tracker.clear_tracking("questions")
        logger.info("Deleted %s questions", num)
        return num
