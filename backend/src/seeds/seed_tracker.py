import json
from pathlib import Path
from typing import Dict, List, Any

TRACKER_PATH = Path(__file__).resolve().parents[2] / "seeds" / ".seed_tracking.json"


def _load() -> Dict[str, List[str]]:
    if not TRACKER_PATH.exists():
        return {}
    try:
        with TRACKER_PATH.open("r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def _save(data: Dict[str, List[str]]) -> None:
    TRACKER_PATH.parent.mkdir(parents=True, exist_ok=True)
    with TRACKER_PATH.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def mark_seeded(entity_type: str, ids: List[str]) -> None:
    """Record newly seeded IDs for an entity type.

    This appends unique IDs to the existing set for the entity type.
    """
    data = _load()
    items = set(data.get(entity_type, []))
    items.update(ids)
    data[entity_type] = list(items)
    _save(data)


def get_seeded_ids(entity_type: str) -> List[str]:
    data = _load()
    return data.get(entity_type, [])


def clear_tracking(entity_type: str) -> None:
    data = _load()
    if entity_type in data:
        del data[entity_type]
        _save(data)


def clear_all() -> None:
    TRACKER_PATH.unlink(missing_ok=True)
