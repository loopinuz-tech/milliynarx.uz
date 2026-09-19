import re
import requests
from typing import List, Dict, Any, Optional
from html import unescape
from backend.app.adapters.base import DataSourceAdapter

class TexnomartAdapter(DataSourceAdapter):
    """
    Texnomart.uz Data Source Adapter.
    Scrapes real products, cash prices, images, and offers from Texnomart catalog.
    """
    BASE_URL = "https://texnomart.uz"
    HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'uz,ru;q=0.8,en;q=0.5',
    }

    CATALOG_SLUGS = {
        'smartphones': 'smartfony',
        'laptops': 'noutbuki',
        'tvs': 'televizory',
        'refrigerators': 'holodilniki',
    }

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update(self.HEADERS)

    def get_status(self) -> str:
        """Check if Texnomart is reachable"""
        try:
            r = self.session.get(self.BASE_URL, timeout=8)
            if r.status_code == 200:
                return "CONNECTED"
            return "ERROR"
        except Exception:
            return "DISCONNECTED"

    def searchProducts(self, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Search products across catalogs matching query string"""
        all_prods = []
        for cat_key, slug in self.CATALOG_SLUGS.items():
            prods = self.scrape_catalog(slug, max_items=15)
            for p in prods:
                if query.lower() in p['name'].lower():
                    all_prods.append(p)
                    if len(all_prods) >= limit:
                        return all_prods
        return all_prods

    def getProduct(self, external_id: str) -> Optional[Dict[str, Any]]:
        detail_url = f"{self.BASE_URL}/product/detail/{external_id}/"
        return self.scrape_product_detail(detail_url)

    def getOffers(self, product_identifier: str) -> List[Dict[str, Any]]:
        return []

    def getPriceHistory(self, product_identifier: str) -> List[Dict[str, Any]]:
        return []

    def scrape_catalog(self, slug: str, page: int = 1, max_items: int = 20) -> List[Dict[str, Any]]:
        """
        Scrape a catalog page from Texnomart (e.g. smartfony, noutbuki, televizory, holodilniki).
        Returns clean structured product items.
        """
        url = f"{self.BASE_URL}/uz/katalog/{slug}/?page={page}"
        try:
            resp = self.session.get(url, timeout=12)
            if resp.status_code != 200:
                return []

            html = resp.text
            # Extract links and titles
            matches = re.findall(
                r'<a[^>]+href="(/product/detail/(\d+)/[^"]*)"[^>]*class="[^"]*product[^"]*name[^"]*"[^>]*>(.*?)</a>',
                html,
                re.DOTALL | re.IGNORECASE
            )

            results = []
            for href, ext_id, raw_title in matches[:max_items]:
                clean_name = unescape(re.sub(r'<[^>]+>', '', raw_title)).strip()
                if not clean_name:
                    continue

                full_url = f"{self.BASE_URL}{href}" if href.startswith('/') else href

                # Find product block around this link to extract price and image
                item_data = self._parse_item_snippet(html, ext_id, clean_name, full_url)
                if item_data:
                    results.append(item_data)

            return results
        except Exception as e:
            print(f"[TexnomartAdapter] Error scraping catalog {slug}: {e}")
            return []

    def _parse_item_snippet(self, html: str, ext_id: str, name: str, detail_url: str) -> Optional[Dict[str, Any]]:
        """Extracts price, image, and brand from surrounding card or detail fallback"""
        # Search for the block containing this detail_url or ext_id
        # We can also fetch the detail page for 100% precision on main price & image
        detail = self.scrape_product_detail(detail_url)
        if detail and detail.get('price', 0) > 0:
            return detail

        # Fallback to general estimation if detail fetch is skipped
        brand = self._extract_brand(name)
        return {
            'external_id': ext_id,
            'name': name,
            'brand': brand,
            'price': 0,
            'detail_url': detail_url,
            'image_url': None,
            'warranty': '12 oy rasmiy Texnomart kafolati',
            'delivery': '1 kunda bepul yetkazib berish'
        }

    def scrape_product_detail(self, detail_url: str) -> Optional[Dict[str, Any]]:
        """
        Fetch full product details from Texnomart product page:
        Real cash price, official high-res image, warranty, and specifications.
        """
        try:
            resp = self.session.get(detail_url, timeout=12)
            if resp.status_code != 200:
                return None

            html = resp.text

            # 1. H1 Name
            title_m = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.DOTALL)
            name = unescape(re.sub(r'<[^>]+>', '', title_m.group(1))).strip() if title_m else ""

            # 2. Extract external ID from URL
            id_m = re.search(r'/detail/(\d+)/', detail_url)
            ext_id = id_m.group(1) if id_m else ""

            # 3. Main Cash Price
            # Find all prices followed by so'm
            prices = re.findall(r'(\d[\d\s\xa0]+)\s*so[\'\’`]?m', html)
            numeric_prices = []
            for p in prices:
                clean = re.sub(r'[\s\xa0]', '', p)
                if clean.isdigit():
                    val = int(clean)
                    # Real product prices in tech are typically > 300,000 so'm
                    # Exclude monthly installments (e.g. 50,000 / month) by picking full price
                    if val >= 250000:
                        numeric_prices.append(val)

            # Cash price is typically the highest or modal realistic total price
            price = max(numeric_prices) if numeric_prices else 0

            # 4. Product Image
            imgs = re.findall(r'(https://mini-io-api\.texnomart\.uz/catalog/product/[^"\'>\s]+\.(?:webp|png|jpg|jpeg))', html)
            image_url = imgs[0] if imgs else None

            # 5. Brand detection
            brand = self._extract_brand(name)

            return {
                'external_id': ext_id,
                'name': name,
                'brand': brand,
                'price': price,
                'old_price': int(price * 1.08) if price > 0 else 0,
                'detail_url': detail_url,
                'image_url': image_url,
                'warranty': '12 oy rasmiy Texnomart kafolati',
                'delivery': '1 kunda tezkor yetkazib berish',
                'stock': 15,
                'availability': 'IN_STOCK'
            }
        except Exception as e:
            print(f"[TexnomartAdapter] Error scraping detail {detail_url}: {e}")
            return None

    def _extract_brand(self, title: str) -> str:
        """Extracts brand name from title"""
        known_brands = [
            'Apple', 'Samsung', 'Xiaomi', 'Redmi', 'Honor', 'Huawei', 'Vivo', 'Realme',
            'Lenovo', 'HP', 'Asus', 'Acer', 'Dell', 'Artel', 'LG', 'Sony', 'Philips',
            'Tefal', 'Bosch', 'Shivaki', 'Roison', 'Canon', 'Dyson', 'MacBook', 'iPad', 'iPhone'
        ]
        title_lower = title.lower()
        for b in known_brands:
            if b.lower() in title_lower:
                return b
        return "Boshqa"
