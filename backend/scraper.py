"""
Milliy Narx - Live Market Data Scraper CLI
Scrapes live market data from Texnomart.uz and syncs into local database.

Usage:
    python backend/scraper.py [--items-per-category N]
"""

import sys
import argparse
import os

# Add root directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.db.session import SessionLocal
from backend.app.services.scraper_service import scraper_service

def main():
    parser = argparse.ArgumentParser(description="Milliy Narx Live Web Scraper")
    parser.add_argument(
        "--items",
        type=int,
        default=5,
        help="Number of items to scrape per category (default: 5)"
    )
    args = parser.parse_args()

    print("=" * 60)
    print("  MILLIY NARX - LIVE WEB SCRAPER (TEXNOMART.UZ)")
    print("=" * 60)
    print(f"Target: Texnomart.uz Catalog")
    print(f"Items per category: {args.items}")
    print("Connecting to live source...\n")

    db = SessionLocal()
    try:
        result = scraper_service.sync_texnomart(db, items_per_category=args.items)
        print("\n" + "=" * 60)
        print("  SCRAPER SYNC COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print(f"Status:            {result['status']}")
        print(f"Total Scraped:     {result['scraped_total']}")
        print(f"Products Created:  {result['products_created']}")
        print(f"Products Updated:  {result['products_updated']}")
        print(f"Offers Synced:     {result['offers_created']}")
        print(f"Price Points:      {result['price_points_added']}")
        print(f"Categories:        {', '.join(result['categories_processed'])}")
        print(f"Timestamp:         {result['timestamp']}")
        print("=" * 60)
    except Exception as e:
        print(f"\n[ERROR] Scraper failed: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()
