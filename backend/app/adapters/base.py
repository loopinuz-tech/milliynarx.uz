from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class DataSourceAdapter(ABC):
    """
    Modular Data Source Adapter Interface for Milliy Narx Market Intelligence.
    Adapters connect to permitted external APIs or internal seller engines.
    Status can be: CONNECTED, DISCONNECTED, NOT_CONFIGURED, ERROR.
    """
    
    @abstractmethod
    def get_status(self) -> str:
        """Returns current status: CONNECTED, DISCONNECTED, NOT_CONFIGURED, ERROR"""
        pass

    @abstractmethod
    def searchProducts(self, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Search products in this data source"""
        pass

    @abstractmethod
    def getProduct(self, external_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a single product by external ID"""
        pass

    @abstractmethod
    def getOffers(self, product_identifier: str) -> List[Dict[str, Any]]:
        """Fetch all current market offers for a product"""
        pass

    @abstractmethod
    def getPriceHistory(self, product_identifier: str) -> List[Dict[str, Any]]:
        """Fetch historical price timeline for a product"""
        pass
