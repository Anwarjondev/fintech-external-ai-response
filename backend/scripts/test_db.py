import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db import Base, engine
from app.main import _seed_rules, _seed_user_data

print("Creating tables in PostgreSQL...")
Base.metadata.create_all(bind=engine)
print("Tables created successfully!")

print("Seeding rules...")
_seed_rules()
print("Rules seeded!")

print("Seeding user data...")
_seed_user_data()
print("User data seeded!")

print("PostgreSQL migration complete!")
