import uvicorn
import os
import sys

# Ensure root directory is in path
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT_DIR)

# Fix: Always use absolute path for SQLite DB, resolving from project root
# This ensures the same DB is used regardless of which directory the server is started from
if not os.getenv("DATABASE_URL"):
    db_path = os.path.join(ROOT_DIR, "milliy_narx.db")
    os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"Starting Milliy Narx Market Intelligence API on http://{host}:{port} ...")
    print(f"  Database: {os.environ.get('DATABASE_URL', 'from settings')}")
    uvicorn.run("backend.app.main:app", host=host, port=port, reload=True)
