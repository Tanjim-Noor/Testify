from typing import List
from sqlalchemy.orm import Session
from src.models.exam import Exam
from src.models.user import User, UserRole
from src.seeds.seeders.base_seeder import BaseSeeder
from src.seeds.data.exams import EXAMS
from src.seeds import seed_tracker
from src.services.exam_service import create_exam
from src.schemas.exam import ExamCreate
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class ExamsSeeder(BaseSeeder):
    """Seeder for Exam model. Uses first admin as creator for all exams."""

    def seed(self) -> List[str]:
        created = []
        # find first admin; if multiple use the first
        admin = self.db.query(User).filter(User.role == UserRole.ADMIN).first()
        if not admin:
            raise RuntimeError("No admin user found. Please seed users first")

        for ex in EXAMS:
            # idempotency by title
            existing = self.db.query(Exam).filter(Exam.title == ex.get("title")).first()
            if existing:
                logger.info("Skipping existing exam: %s", ex.get("title"))
                continue
            # convert pydantic model
            payload = ExamCreate(
                title=ex.get("title"),
                description=ex.get("description"),
                start_time=ex.get("start_time"),
                end_time=ex.get("end_time"),
                duration_minutes=ex.get("duration_minutes"),
            )
            created_exam = create_exam(self.db, payload, admin.id)
            created.append(str(created_exam.id))
            logger.info("Created exam %s", created_exam.id)
        self.created_ids = created
        if created:
            seed_tracker.mark_seeded("exams", created)
        return created

    def clean(self) -> int:
        ids = seed_tracker.get_seeded_ids("exams")
        if not ids:
            return 0
        q = self.db.query(Exam).filter(Exam.id.in_(ids))
        num = q.count()
        q.delete(synchronize_session=False)
        self.db.commit()
        seed_tracker.clear_tracking("exams")
        logger.info("Deleted %s exams", num)
        return num
