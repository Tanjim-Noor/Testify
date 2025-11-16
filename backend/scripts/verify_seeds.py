"""Simple verification script to check seeded counts and relationships."""

import sys
from pathlib import Path

# Ensure the backend folder is on sys.path so imports like `src.*` work
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.config.database import SessionLocal
from src.models.user import User
from src.models.question import Question
from src.models.exam import Exam
from src.models.exam_question import ExamQuestion
from src.models.student_exam import StudentExam
from src.models.student_answer import StudentAnswer


def main():
    db = SessionLocal()
    print("Users:", db.query(User).count())
    print("Questions:", db.query(Question).count())
    print("Exams:", db.query(Exam).count())
    print("ExamQuestions:", db.query(ExamQuestion).count())
    print("StudentExams:", db.query(StudentExam).count())
    print("StudentAnswers:", db.query(StudentAnswer).count())
    db.close()

if __name__ == '__main__':
    main()
