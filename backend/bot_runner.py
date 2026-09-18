import os
import sys

# Set root directory
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT_DIR)

from backend.app.services.telegram_bot import run_bot_polling
from backend.app.core.config import settings

if __name__ == "__main__":
    print("=" * 60)
    print(f"  Milliy Narx Telegram Bot Service (@{settings.TELEGRAM_BOT_USERNAME})")
    print("  Token: Active")
    print("  Status: Polling started...")
    print("=" * 60)
    run_bot_polling()
