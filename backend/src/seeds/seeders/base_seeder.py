from typing import List, Optional
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)


class BaseSeeder:
    """Base seeder class that provides a simple interface for seeders.

    Subclasses should override `seed` and `clean`. They should return the list
    of created database IDs in `seed` and handle deletion in `clean`.
    """

    def __init__(self, db: Session):
        self.db = db
        self.created_ids: List[str] = []

    def seed(self) -> List[str]:
        raise NotImplementedError()

    def clean(self) -> int:
        raise NotImplementedError()

    def get_seeded_ids(self) -> List[str]:
        return self.created_ids

    def _log(self, message: str) -> None:
        logger.info(message)
