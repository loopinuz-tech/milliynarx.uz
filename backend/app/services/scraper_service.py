import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.adapters.texnomart import TexnomartAdapter
from backend.app.db.models import (
    Product, ProductImage, Offer, PriceHistory, Seller, User, Role,
    Category, Brand, DataSource
)
from backend.app.core.slug import slugify, generate_unique_slug

logger = logging.getLogger(__name__)

CATEGORY_MAP = {
    'smartfony': 'smartfonlar-va-gadjetlar',
    'noutbuki': 'noutbuklar-va-it-uskunalar',
    'televizory': 'televizorlar-va-audio',
    'holodilniki': 'maishiy-texnika'
}

class ScraperService:
    def __init__(self):
        self.texnomart_adapter = TexnomartAdapter()

    def get_or_create_texnomart_seller(self, db: Session) -> Seller:
        """Ensure Texnomart verified store exists in the sellers table"""
        seller = db.query(Seller).filter(
            (Seller.slug == 'texnomart-rasmiy-dokoni') | (Seller.store_name == 'Texnomart')
        ).first()

        if not seller:
            # Check or create user for Texnomart
            user = db.query(User).filter(User.email == 'seller@texnomart.uz').first()
            if not user:
                user = User(
                    email='seller@texnomart.uz',
                    phone='+998712099999',
                    hashed_password='$2b$12$e80y5K0z/texnomart.hash.placeholder',
                    role='SELLER',
                    is_active=True,
                    is_verified=True
                )
                db.add(user)
                db.flush()

            seller = Seller(
                user_id=user.id,
                store_name="Texnomart Rasmiy Do'koni",
                slug='texnomart-rasmiy-dokoni',
                market_name='Texnomart.uz Riteyl Tarmoqlari',
                business_reg_number='REG-TEXNOMART-001',
                tax_id='TIN-998712003',
                status='APPROVED',
                rating=4.97,
                rating_count=1840,
                is_verified=True,
                plan='PRO',
                product_limit=99999,
                payment_methods='click,payme,uzum,cash,card',
                onboarding_completed=True
            )
            db.add(seller)
            db.commit()
            db.refresh(seller)

        return seller

    def get_or_create_brand(self, db: Session, brand_name: str) -> Optional[str]:
        """Fetch or insert brand by name"""
        if not brand_name or brand_name == 'Boshqa':
            return None
        brand = db.query(Brand).filter(Brand.name.ilike(brand_name)).first()
        if not brand:
            brand = Brand(name=brand_name, slug=slugify(brand_name))
            db.add(brand)
            db.flush()
        return brand.id

    def sync_texnomart(self, db: Session, items_per_category: int = 5) -> Dict[str, Any]:
        """
        Main scraper sync workflow:
        1. Connects to Texnomart.uz
        2. Scrapes live products across primary categories
        3. Updates existing products & offers with real scraped prices
        4. Creates new verified products with high-res Texnomart images
        5. Logs PriceHistory entries and updates DataSource status
        """
        logger.info("Starting Texnomart sync...")
        seller = self.get_or_create_texnomart_seller(db)
        
        stats = {
            "scraped_total": 0,
            "products_created": 0,
            "products_updated": 0,
            "offers_created": 0,
            "price_points_added": 0,
            "categories_processed": []
        }

        # Ensure DataSource entry exists
        ds = db.query(DataSource).filter(
            (DataSource.adapter_code == 'TEXNOMART') | (DataSource.name.ilike('%texnomart%'))
        ).first()
        if not ds:
            ds = DataSource(
                name="Texnomart",
                adapter_code="TEXNOMART",
                status="CONNECTED"
            )
            db.add(ds)
            db.commit()

        for cat_slug, db_cat_slug in CATEGORY_MAP.items():
            category = db.query(Category).filter(Category.slug == db_cat_slug).first()
            category_id = category.id if category else None

            logger.info(f"Scraping category '{cat_slug}' -> DB category '{db_cat_slug}'")
            scraped_items = self.texnomart_adapter.scrape_catalog(cat_slug, page=1, max_items=items_per_category)
            stats["scraped_total"] += len(scraped_items)
            stats["categories_processed"].append(cat_slug)

            for item in scraped_items:
                if not item or item.get('price', 0) <= 0:
                    continue

                item_name = item['name']
                item_price = float(item['price'])
                item_old_price = float(item.get('old_price') or item_price * 1.08)
                brand_id = self.get_or_create_brand(db, item.get('brand', ''))

                # 1. Check if product already exists in DB
                existing_product = self._find_matching_product(db, item_name)

                if existing_product:
                    # Update existing product if scraped price is valid
                    target_prod = existing_product
                    old_p = target_prod.price
                    
                    # Update product base fields if needed
                    if item.get('image_url') and not target_prod.images:
                        img = ProductImage(
                            product_id=target_prod.id,
                            image_url=item['image_url'],
                            is_primary=True,
                            display_order=0
                        )
                        db.add(img)

                    stats["products_updated"] += 1
                else:
                    # Create new Product
                    slug = generate_unique_slug(db, Product, item_name)

                    target_prod = Product(
                        seller_id=seller.id,
                        category_id=category_id,
                        brand_id=brand_id,
                        name=item_name,
                        slug=slug,
                        price=item_price,
                        old_price=item_old_price,
                        currency="UZS",
                        stock=item.get('stock', 15),
                        availability="IN_STOCK",
                        condition="NEW",
                        warranty=item.get('warranty', '12 oy rasmiy Texnomart kafolati'),
                        delivery=item.get('delivery', '1 kunda yetkazib berish'),
                        description=f"Texnomart.uz orqali rasmiy kafolatlangan {item_name}. Asl mahsulot, 100% rasmiy import.",
                        status="ACTIVE"
                    )
                    db.add(target_prod)
                    db.flush()

                    if item.get('image_url'):
                        img = ProductImage(
                            product_id=target_prod.id,
                            image_url=item['image_url'],
                            is_primary=True,
                            display_order=0
                        )
                        db.add(img)

                    stats["products_created"] += 1

                # 2. Add or update Texnomart Offer for this product
                offer = db.query(Offer).filter(
                    Offer.product_id == target_prod.id,
                    Offer.seller_id == seller.id
                ).first()

                if not offer:
                    offer = Offer(
                        product_id=target_prod.id,
                        seller_id=seller.id,
                        price=item_price,
                        old_price=item_old_price,
                        stock=item.get('stock', 15),
                        availability="IN_STOCK",
                        condition="NEW",
                        delivery_days=1
                    )
                    db.add(offer)
                    stats["offers_created"] += 1
                else:
                    offer.price = item_price
                    offer.old_price = item_old_price
                    offer.availability = "IN_STOCK"
                    offer.updated_at = datetime.utcnow()

                # 3. Add PriceHistory snapshot
                hist = PriceHistory(
                    product_id=target_prod.id,
                    seller_id=seller.id,
                    price=item_price,
                    old_price=item_old_price,
                    source="TEXNOMART",
                    recorded_at=datetime.utcnow()
                )
                db.add(hist)
                stats["price_points_added"] += 1

        # Finalize DataSource sync timestamp and status
        if ds:
            ds.status = "CONNECTED"
            ds.last_sync_at = datetime.utcnow()
            ds.error_message = None
            ds.updated_at = datetime.utcnow()

        db.commit()
        logger.info(f"Sync complete. Stats: {stats}")
        return {
            "status": "SUCCESS",
            "timestamp": datetime.utcnow().isoformat(),
            **stats
        }

    def _find_matching_product(self, db: Session, raw_name: str) -> Optional[Product]:
        """Fuzzy-matches a scraped title with existing DB products"""
        # 1. Exact or partial ilike match
        clean_raw = raw_name.lower().strip()
        
        # Check first 3 key words (e.g. "iphone 15 pro", "samsung galaxy s24")
        words = [w for w in clean_raw.split() if len(w) > 2][:3]
        if words:
            query = db.query(Product)
            for w in words:
                query = query.filter(Product.name.ilike(f"%{w}%"))
            candidate = query.first()
            if candidate:
                return candidate

        return None

scraper_service = ScraperService()
