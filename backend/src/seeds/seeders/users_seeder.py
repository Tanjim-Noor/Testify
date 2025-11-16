from typing import List, Dict
from sqlalchemy.orm import Session
from src.models.user import User, UserRole
from src.utils.auth import get_password_hash
from src.seeds.seeders.base_seeder import BaseSeeder
from src.seeds.data.users import ALL_USERS
from src.seeds import seed_tracker
import logging

logger = logging.getLogger(__name__)


class UsersSeeder(BaseSeeder):
    """Seeder for User model. Idempotent: will skip users with existing email."""

    def seed(self) -> List[str]:
        created = []
        for u in ALL_USERS:
            email = u.get("email")
            existing = self.db.query(User).filter(User.email == email).first()
            if existing:
                logger.info("Skipping existing user: %s", email)
                continue

            password_hash = get_password_hash(u.get("password"))
            role = UserRole.ADMIN if u.get("role") == "admin" else UserRole.STUDENT
            new = User(email=email, password_hash=password_hash, role=role)
            self.db.add(new)
            self.db.commit()
            self.db.refresh(new)
            created.append(str(new.id))
            logger.info("Created user %s with id %s", email, new.id)
        self.created_ids = created
        if created:
            seed_tracker.mark_seeded("users", created)
        return created

    def clean(self) -> int:
        # Remove seeded users by recorded IDs
        ids = seed_tracker.get_seeded_ids("users")
        if not ids:
            return 0
        q = self.db.query(User).filter(User.id.in_(ids))
        num = q.count()
        q.delete(synchronize_session=False)
        self.db.commit()
        seed_tracker.clear_tracking("users")
        logger.info("Deleted %s users", num)
        return num
