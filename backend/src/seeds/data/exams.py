from datetime import datetime, timezone, timedelta

now = datetime.now(timezone.utc)

EXAMS = [
    {
        "title": "Mathematics Final Exam - Grade 5",
        "description": "Comprehensive exam covering arithmetic and basics.",
        "start_time": now - timedelta(hours=1),
        "end_time": now + timedelta(days=7),
        "duration_minutes": 60,
        "status": "published",
    },
    {
        "title": "Science Midterm Assessment",
        "description": "Covers chapters 1-6 of science textbook.",
        "start_time": now - timedelta(days=10),
        "end_time": now - timedelta(days=9),
        "duration_minutes": 90,
        "status": "ended",
    },
    {
        "title": "English Literature Quiz",
        "description": "Short quiz on poems and prose.",
        "start_time": now + timedelta(days=3),
        "end_time": now + timedelta(days=3, hours=2),
        "duration_minutes": 30,
        "status": "upcoming",
    },
    {
        "title": "History Test - Ancient Civilizations",
        "description": "Practice test for Ancient history.",
        "start_time": now + timedelta(days=20),
        "end_time": now + timedelta(days=20, hours=1),
        "duration_minutes": 60,
        "status": "draft",
    },
    {
        "title": "Practice Test - General Knowledge",
        "description": "A small practice test for new users.",
        "start_time": now - timedelta(hours=1),
        "end_time": now + timedelta(hours=1),
        "duration_minutes": 30,
        "status": "published",
    }
]
