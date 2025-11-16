# Database Seeds

This package contains lightweight seed scripts used to populate the development database with realistic test data for admin and student development workflows.

Structure:
- `data/` — Python modules containing seed data definitions
- `seeders/` — per-entity seeders that insert and cleanup their entities
- `seed_manager.py` — orchestrator to seed in dependency order and clean up
- `seed_tracker.py` — reads/writes `.seed_tracking.json` to track IDs created during a seed run

Usage (from repo root):

```powershell
cd backend
python -u scripts/seed.py all
```

See `backend/scripts/seed.py --help` for more commands.
