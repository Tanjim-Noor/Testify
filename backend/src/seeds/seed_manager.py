from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from src.config.database import SessionLocal
from src.models.exam import Exam
from src.seeds.seeders.users_seeder import UsersSeeder
from src.seeds.seeders.questions_seeder import QuestionsSeeder
from src.seeds.seeders.exams_seeder import ExamsSeeder
from src.seeds.seeders.exam_questions_seeder import ExamQuestionsSeeder
from src.seeds.seeders.student_exams_seeder import StudentExamsSeeder
from src.seeds.seeders.student_answers_seeder import StudentAnswersSeeder
from src.seeds import seed_tracker
from src.config.settings import settings
from src.seeds.data.exams import EXAMS as EXAM_DATA
from src.services.exam_service import publish_exam
from typing import cast, Any
import logging

logger = logging.getLogger(__name__)


class SeedManager:
    """Orchestrates seeders and provides methods for seeding and cleaning.

    Seeding order:
        - users
        - questions
        - exams
        - exam_questions
        - student_exams
        - student_answers
    """

    def __init__(self, db: Optional[Session] = None):
        self.db = db or SessionLocal()
        self.seeders = {
            "users": UsersSeeder(self.db),
            "questions": QuestionsSeeder(self.db),
            "exams": ExamsSeeder(self.db),
            "exam_questions": ExamQuestionsSeeder(self.db),
            "student_exams": StudentExamsSeeder(self.db),
            "student_answers": StudentAnswersSeeder(self.db),
        }
        # Internal flag used to bypass the DEBUG safety check when the
        # user confirmed interactively or via CLI --force
        self._allow_confirmed: bool = False

    def _ensure_safe(self, force: bool) -> None:
        # Allow seed operations if DEBUG is True, or if CLI passed --force,
        # or when the interactive confirmation flag has been set by the caller.
        if not settings.DEBUG and not force and not self._allow_confirmed:
            raise RuntimeError("Refusing to run seeders in non-debug mode without --force")

    def seed_all(self, force: bool = False) -> Dict[str, List[str]]:
        self._ensure_safe(force)
        result: Dict[str, List[str]] = {}
        # run seeders in correct order
        order = ["users", "questions", "exams", "exam_questions", "student_exams", "student_answers"]
        for name in order:
            seeder = self.seeders[name]
            try:
                created = seeder.seed()
                result[name] = created
                logger.info("Seeded %s: %d", name, len(created))
            except Exception as e:
                logger.exception("Failed to seed %s: %s", name, e)
                # continue to next seeder optionally
            # After exam_questions are assigned, publish exams that were marked as published in EXAMS
            if name == "exam_questions":
                try:
                    for ex in EXAM_DATA:
                        if ex.get("status") == "published":
                            # find exam by title
                            exam_obj = self.db.query(Exam).filter(Exam.title == ex.get("title")).first()
                            if exam_obj:
                                publish_exam(self.db, cast(Any, exam_obj.id), True)
                                logger.info("Published seeded exam: %s", exam_obj.title)
                except Exception as e:
                    logger.exception("Failed to publish exams after assignment: %s", e)
        return result

    def clean_all(self, force: bool = False) -> Dict[str, int]:
        self._ensure_safe(force)
        # Clean in reverse order to respect dependencies
        order = ["student_answers", "student_exams", "exam_questions", "exams", "questions", "users"]
        summary: Dict[str, int] = {}
        for name in order:
            seeder = self.seeders[name]
            try:
                num = seeder.clean()
                summary[name] = num
                logger.info("Cleaned %s: %d", name, num)
            except Exception as e:
                logger.exception("Failed to clean %s: %s", name, e)
        return summary

    # Per-entity helpers
    def seed_users(self) -> List[str]:
        return self.seeders["users"].seed()

    def seed_questions(self) -> List[str]:
        return self.seeders["questions"].seed()

    def seed_exams(self) -> List[str]:
        return self.seeders["exams"].seed()

    def seed_exam_questions(self) -> List[str]:
        return self.seeders["exam_questions"].seed()

    def seed_student_exams(self) -> List[str]:
        return self.seeders["student_exams"].seed()

    def seed_student_answers(self) -> List[str]:
        return self.seeders["student_answers"].seed()

    def clean_users(self) -> int:
        return self.seeders["users"].clean()

    def clean_questions(self) -> int:
        return self.seeders["questions"].clean()

    def clean_exams(self) -> int:
        return self.seeders["exams"].clean()

    def clean_exam_questions(self) -> int:
        return self.seeders["exam_questions"].clean()

    def clean_student_exams(self) -> int:
        return self.seeders["student_exams"].clean()

    def clean_student_answers(self) -> int:
        return self.seeders["student_answers"].clean()

    def clear_tracking(self) -> None:
        seed_tracker.clear_all()
