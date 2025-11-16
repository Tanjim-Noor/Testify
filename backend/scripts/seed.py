#!/usr/bin/env python
"""Seed CLI for development databases.

Usage examples:
    python scripts/seed.py all
    python scripts/seed.py users
    python scripts/seed.py clean --force
"""

import argparse
import logging
import sys
from pathlib import Path

# Ensure the backend folder is on sys.path so imports like `src.*` work
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.seeds.seed_manager import SeedManager
from src.config.settings import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    parser = argparse.ArgumentParser(description="Manage database seeds")
    subparsers = parser.add_subparsers(dest="command")

    # seeding commands
    subparsers.add_parser("all")
    subparsers.add_parser("users")
    subparsers.add_parser("questions")
    subparsers.add_parser("exams")
    subparsers.add_parser("exam-questions")
    subparsers.add_parser("student-exams")
    subparsers.add_parser("student-answers")

    # cleaning commands
    subparsers.add_parser("clean")
    subparsers.add_parser("clean:users")
    subparsers.add_parser("clean:questions")
    subparsers.add_parser("clean:exams")
    subparsers.add_parser("clean:exam-questions")
    subparsers.add_parser("clean:student-exams")
    subparsers.add_parser("clean:student-answers")

    parser.add_argument("--force", action="store_true", help="Force seed/clean even if not DEBUG")

    args = parser.parse_args()
    manager = SeedManager()

    try:
        if args.command == "all":
            # If not DEBUG and not forced, ask for confirmation interactively
            if not settings.DEBUG and not args.force:
                answer = input("DEBUG is False; run seeds anyway? Type 'yes' to proceed: ")
                if answer.strip().lower() != "yes":
                    logger.info("Aborted seeding; use --force to override or set DEBUG=true in .env")
                    return
                # Inform manager that an interactive confirmation happened
                manager._allow_confirmed = True
            res = manager.seed_all(force=args.force)
            logger.info("Seed complete: %s", {k: len(v) for k, v in res.items()})
        elif args.command == "users":
            ids = manager.seed_users()
            logger.info("seeded users: %s", ids)
        elif args.command == "questions":
            manager.seed_questions()
        elif args.command == "exams":
            manager.seed_exams()
        elif args.command == "exam-questions":
            manager.seed_exam_questions()
        elif args.command == "student-exams":
            manager.seed_student_exams()
        elif args.command == "student-answers":
            manager.seed_student_answers()
        elif args.command == "clean":
            if not settings.DEBUG and not args.force:
                answer = input("DEBUG is False; clean will remove seeded data. Type 'yes' to proceed: ")
                if answer.strip().lower() != "yes":
                    logger.info("Aborted cleanup; use --force to override or set DEBUG=true in .env")
                    return
                # Inform manager that an interactive confirmation happened
                manager._allow_confirmed = True
            res = manager.clean_all(force=args.force)
            logger.info("Clean complete: %s", res)
        elif args.command == "clean:users":
            manager.clean_users()
        elif args.command == "clean:questions":
            manager.clean_questions()
        elif args.command == "clean:exams":
            manager.clean_exams()
        elif args.command == "clean:exam-questions":
            manager.clean_exam_questions()
        elif args.command == "clean:student-exams":
            manager.clean_student_exams()
        elif args.command == "clean:student-answers":
            manager.clean_student_answers()
        else:
            parser.print_help()
    except Exception as e:
        logger.exception("Failed: %s", e)

if __name__ == "__main__":
    main()
