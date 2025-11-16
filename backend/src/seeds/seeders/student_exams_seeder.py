from typing import List
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from src.models.student_exam import StudentExam, ExamStatus
from src.models.exam import Exam
from src.models.user import User, UserRole
from src.seeds.seeders.base_seeder import BaseSeeder
from src.seeds import seed_tracker
import logging

logger = logging.getLogger(__name__)


class StudentExamsSeeder(BaseSeeder):
    """Create some example student exam sessions for published exams."""

    def seed(self) -> List[str]:
        students = self.db.query(User).filter(User.role == UserRole.STUDENT).all()
        if not students:
            logger.warning("No students available to seed student exams")
            return []

        exams = self.db.query(Exam).filter(Exam.is_published == True).all()
        if not exams:
            logger.warning("No published exams available")
            return []

        created = []
        # For each published exam create one in-progress and one submitted for a sample of students
        for exam in exams:
            for i, student in enumerate(students[:2]):
                # alternate between in-progress and submitted
                if i % 2 == 0:
                    se = StudentExam(
                        exam_id=exam.id,
                        student_id=student.id,
                        started_at=datetime.now(timezone.utc) - timedelta(minutes=10),
                        status=ExamStatus.IN_PROGRESS,
                    )
                else:
                    se = StudentExam(
                        exam_id=exam.id,
                        student_id=student.id,
                        started_at=datetime.now(timezone.utc) - timedelta(hours=1),
                        submitted_at=datetime.now(timezone.utc),
                        status=ExamStatus.SUBMITTED,
                        total_score=0.0,
                    )
                self.db.add(se)
                self.db.commit()
                self.db.refresh(se)
                created.append(str(se.id))
                logger.info("Created student exam session %s for student %s (exam %s)", se.id, student.email, exam.title)

        self.created_ids = created
        if created:
            seed_tracker.mark_seeded("student_exams", created)
        return created

    def clean(self) -> int:
        ids = seed_tracker.get_seeded_ids("student_exams")
        if not ids:
            return 0
        q = self.db.query(StudentExam).filter(StudentExam.id.in_(ids))
        num = q.count()
        q.delete(synchronize_session=False)
        self.db.commit()
        seed_tracker.clear_tracking("student_exams")
        logger.info("Deleted %s student_exams", num)
        return num
