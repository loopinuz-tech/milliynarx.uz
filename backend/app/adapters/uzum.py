from typing import List, Dict, Any, Optional
from backend.app.adapters.base import DataSourceAdapter

class UzumMarketAdapter(DataSourceAdapter):
    """
    Official Uzum Market API Adapter.
    Adheres strictly to requirement 29:
    - Never bypasses CAPTCHA, bot detection, or paywalls.
    - Operates only when official merchant / partner credentials are provided.
    - Default status is NOT_CONFIGURED.
    """
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key

    def get_status(self) -> str:
        if not self.api_key:
            return "NOT_CONFIGURED"
        return "DISCONNECTED"

    def searchProducts(self, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        if not self.api_key:
            return []
        return []

    def getProduct(self, external_id: str) -> Optional[Dict[str, Any]]:
        return None

    def getOffers(self, product_identifier: str) -> List[Dict[str, Any]]:
        return []

    def getPriceHistory(self, product_identifier: str) -> List[Dict[str, Any]]:
        return []

class ManualSellerAdapter(DataSourceAdapter):
    """
    Manual Registered Sellers Adapter.
    Verified merchants registered directly on Milliy Narx platform.
    """
    def get_status(self) -> str:
        return "CONNECTED"

    def searchProducts(self, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        return []

    def getProduct(self, external_id: str) -> Optional[Dict[str, Any]]:
        return None

    def getOffers(self, product_identifier: str) -> List[Dict[str, Any]]:
        return []

    def getPriceHistory(self, product_identifier: str) -> List[Dict[str, Any]]:
        return []
