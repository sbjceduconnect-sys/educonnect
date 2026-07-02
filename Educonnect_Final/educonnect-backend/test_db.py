import os
import psycopg
from dotenv import load_dotenv

load_dotenv()

print("Testing connection to PostgreSQL...")
print(f"DB_NAME: {os.getenv('DB_NAME')}")
print(f"DB_USER: {os.getenv('DB_USER')}")
print(f"DB_HOST: {os.getenv('DB_HOST')}")
print(f"DB_PORT: {os.getenv('DB_PORT')}")

try:
    conn = psycopg.connect(
        dbname=os.getenv('DB_NAME'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        host=os.getenv('DB_HOST'),
        port=os.getenv('DB_PORT'),
        connect_timeout=5
    )
    print("Success! Connected to PostgreSQL database.")
    conn.close()
except Exception as e:
    print("Failed to connect!")
    print(e)
