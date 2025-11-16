from datetime import datetime, timezone

PASSWORD = "password123"

admins = [
    {"email": "admin@seeder.com", "role": "admin", "password": PASSWORD, "created_at": datetime.now(timezone.utc)},
    {"email": "teacher@example.com", "role": "admin", "password": PASSWORD, "created_at": datetime.now(timezone.utc)},
]

students = [
    {"email": "john.doe@student.com", "role": "student", "password": PASSWORD, "created_at": datetime.now(timezone.utc)},
    {"email": "jane.smith@student.com", "role": "student", "password": PASSWORD, "created_at": datetime.now(timezone.utc)},
    {"email": "alice.johnson@student.com", "role": "student", "password": PASSWORD, "created_at": datetime.now(timezone.utc)},
    {"email": "bob.wilson@student.com", "role": "student", "password": PASSWORD, "created_at": datetime.now(timezone.utc)},
    {"email": "charlie.brown@student.com", "role": "student", "password": PASSWORD, "created_at": datetime.now(timezone.utc)},
]

ALL_USERS = admins + students
