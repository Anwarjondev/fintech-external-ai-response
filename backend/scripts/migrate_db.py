import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, MetaData, text
from sqlalchemy.orm import sessionmaker

# 1. Setup connections
sqlite_url = "sqlite:///./legal_mvp.db"
postgres_url = "postgresql://postgres:password@localhost:5433/legal_mvp"

sqlite_engine = create_engine(sqlite_url)
postgres_engine = create_engine(postgres_url)

# 2. Reflect metadata from SQLite
metadata = MetaData()
metadata.reflect(bind=sqlite_engine)

# 3. Create a session for Postgres
PostgresSession = sessionmaker(bind=postgres_engine)
pg_session = PostgresSession()

print("Migrating data from SQLite to PostgreSQL...")

try:
    with postgres_engine.connect() as pg_conn:
        with sqlite_engine.connect() as sl_conn:
            table_names = list(metadata.tables.keys())
            
            # Disable triggers/constraints for truncation or just delete rows
            for table_name in reversed(table_names):
                print(f"Deleting existing data from {table_name} in PostgreSQL...")
                pg_conn.execute(metadata.tables[table_name].delete())
            
            pg_conn.commit()

            # Now insert data
            for table_name in table_names:
                print(f"Migrating table: {table_name}...")
                table = metadata.tables[table_name]
                
                # Fetch all rows from SQLite
                result = sl_conn.execute(table.select()).fetchall()
                
                if result:
                    # Convert to list of dicts
                    rows = [row._asdict() for row in result]
                    # Insert into Postgres
                    pg_conn.execute(table.insert(), rows)
                    
            pg_conn.commit()
            print("Data migration completed successfully!")
            
except Exception as e:
    print(f"Error during migration: {e}")
finally:
    pg_session.close()

# Update sequence generators in postgres so new inserts don't fail due to pk conflicts
print("Resetting sequences in PostgreSQL...")
try:
    with postgres_engine.connect() as pg_conn:
        for table_name in metadata.tables.keys():
            table = metadata.tables[table_name]
            if 'id' in table.columns:
                seq_name = f"{table_name}_id_seq"
                try:
                    # Set the sequence to the maximum id in the table + 1
                    query = f"SELECT setval('{seq_name}', COALESCE((SELECT MAX(id) FROM {table_name}), 1), EXISTS (SELECT 1 FROM {table_name}));"
                    pg_conn.execute(text(query))
                except Exception as seq_e:
                    print(f"Warning: Could not reset sequence for {table_name}: {seq_e}")
        pg_conn.commit()
    print("Sequences reset.")
except Exception as e:
    print(f"Error resetting sequences: {e}")
