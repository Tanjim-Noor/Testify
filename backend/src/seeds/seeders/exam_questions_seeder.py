from typing import List
from random import sample
from sqlalchemy.orm import Session
from src.models.exam import Exam
from src.models.question import Question
from src.services.exam_service import assign_questions, publish_exam
from src.schemas.exam import ExamQuestionAssignment
from src.seeds.seeders.base_seeder import BaseSeeder
from src.seeds import seed_tracker
import logging

logger = logging.getLogger(__name__)


class ExamQuestionsSeeder(BaseSeeder):
    """Assign questions to exams and optionally publish them if indicated in exam status."""

    def seed(self) -> List[str]:
        created_ids = []
        exams = self.db.query(Exam).all()
        questions = self.db.query(Question).all()
        if not questions:
            raise RuntimeError("No questions found. Run questions seeder first.")

        for exam in exams:
            # choose a mix of 5-10 unique questions
            count = min(10, max(5, len(questions)))
            # If fewer than 5 questions available, assign all
            qpool = questions
            if len(qpool) > count:
                qpool = sample(qpool, count)

            assignments = []
            for idx, q in enumerate(qpool):
                assignments.append(ExamQuestionAssignment(question_id=q.id, order_index=idx))

            try:
                assign_questions(self.db, exam.id, assignments)
                created_ids.append(str(exam.id))
                logger.info("Assigned %s questions to exam %s", len(assignments), exam.id)
            except Exception as e:
                logger.exception("Failed to assign questions to exam %s: %s", exam.id, e)
                continue

            # Publishing is handled by SeedManager after exam questions assignment

        self.created_ids = created_ids
        if created_ids:
            seed_tracker.mark_seeded("exam_questions", created_ids)
        return created_ids

    def clean(self) -> int:
        # Remove all assignments created by seeding; if we track only exam ids, delete by exam_id
        ids = seed_tracker.get_seeded_ids("exam_questions")
        if not ids:
            return 0
        from src.models.exam_question import ExamQuestion

        num = self.db.query(ExamQuestion).filter(ExamQuestion.exam_id.in_(ids)).delete(synchronize_session=False)
        self.db.commit()
        seed_tracker.clear_tracking("exam_questions")
        logger.info("Deleted %s exam->question assignments", num)
        return num
