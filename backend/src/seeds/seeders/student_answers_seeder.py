from typing import List
from sqlalchemy.orm import Session
from src.models.student_exam import StudentExam, ExamStatus
from src.models.question import Question
from src.models.student_answer import StudentAnswer
from src.seeds.seeders.base_seeder import BaseSeeder
from src.seeds import seed_tracker
from src.services.grading_service import grade_question
import logging

logger = logging.getLogger(__name__)


class StudentAnswersSeeder(BaseSeeder):
    """Creates student answers for submitted student_exams with a mix of correct/incorrect answers.

    This seeder only creates answers for student_exams with status SUBMITTED.
    """

    def seed(self) -> List[str]:
        created = []
        submitted = self.db.query(StudentExam).filter(StudentExam.status == ExamStatus.SUBMITTED).all()
        if not submitted:
            logger.info("No submitted student exams to seed answers for")
            return created

        for se in submitted:
            # fetch questions for this exam
            questions = [eq.question for eq in se.exam.exam_questions]
            for q in questions:
                # create answer structure based on type
                av = {}
                is_correct = None
                score = None
                if q.type == "single_choice":
                    # use correct answer half the time
                    av = {"answer": (q.correct_answers[0] if q.correct_answers else "A")}
                    is_correct, score = grade_question(q, av)
                elif q.type == "multi_choice":
                    av = {"answers": q.correct_answers}
                    is_correct, score = grade_question(q, av)
                elif q.type == "text":
                    av = {"text": "This is a seeded sample answer."}
                    # manual grading expected — leave score None for manual review
                    is_correct = None
                    score = None
                elif q.type == "image_upload":
                    av = {"url": "https://example.com/images/seed.png"}
                    is_correct = None
                    score = None

                sa = StudentAnswer(
                    student_exam_id=se.id,
                    question_id=q.id,
                    answer_value=av,
                    is_correct=is_correct,
                    score=float(score) if score is not None else None,
                )
                self.db.add(sa)
                logger.info("Added seeded answer for exam %s, question %s", se.id, q.id)

            self.db.commit()
            self.db.refresh(se)
            created.append(str(se.id))

        self.created_ids = created
        if created:
            seed_tracker.mark_seeded("student_answers", created)
        return created

    def clean(self) -> int:
        ids = seed_tracker.get_seeded_ids("student_answers")
        if not ids:
            return 0
        num = self.db.query(StudentAnswer).filter(StudentAnswer.student_exam_id.in_(ids)).delete(synchronize_session=False)
        self.db.commit()
        seed_tracker.clear_tracking("student_answers")
        logger.info("Deleted %s student answers", num)
        return num
