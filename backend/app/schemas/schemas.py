from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

# Auth schemas
class UserBase(BaseModel):
    email: EmailStr
    phone: Optional[str] = None
    role: str = "BUYER"

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    phone: Optional[str] = None
    role: str = "BUYER" # BUYER or SELLER
    # If SELLER registration
    store_name: Optional[str] = None
    business_reg_number: Optional[str] = None
    tax_id: Optional[str] = None
    location: Optional[str] = "Toshkent"
    logo_url: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class UserOut(BaseModel):
    id: str
    email: EmailStr
    phone: Optional[str]
    role: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    profile: Optional[Dict[str, Any]] = None
    seller: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class AdminUserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None # BUYER, SELLER, ADMIN
    is_active: Optional[bool] = None

# Seller schemas
class SellerProfileOut(BaseModel):
    id: str
    store_name: str
    slug: str
    business_reg_number: Optional[str]
    tax_id: Optional[str]
    status: str
    rating: float
    rating_count: int
    is_verified: bool
    created_at: datetime
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    website: Optional[str] = None
    contact_phone: Optional[str] = None

    class Config:
        from_attributes = True

class SellerProfileUpdate(BaseModel):
    store_name: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    banner_url: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    website: Optional[str] = None
    contact_phone: Optional[str] = None

# Product schemas
class ProductImageOut(BaseModel):
    id: str
    image_url: str
    is_primary: bool
    display_order: int

    class Config:
        from_attributes = True

class PriceHistoryOut(BaseModel):
    id: str
    price: float
    old_price: Optional[float]
    change_amount: Optional[float]
    change_percent: Optional[float]
    source: str
    recorded_at: datetime

    class Config:
        from_attributes = True

class ProductCreate(BaseModel):
    name: str = Field(..., min_length=2)
    category_id: Optional[str] = None
    brand_id: Optional[str] = None
    model: Optional[str] = None
    sku: Optional[str] = None
    barcode: Optional[str] = None
    description: Optional[str] = None
    price: float = Field(..., gt=0)
    old_price: Optional[float] = None
    currency: str = "UZS"
    stock: int = Field(default=0, ge=0)
    availability: str = "IN_STOCK"
    condition: str = "NEW"
    location: str = "Toshkent"
    warranty: Optional[str] = None
    delivery: Optional[str] = None
    specifications: Optional[Dict[str, Any]] = None
    images: Optional[List[str]] = []
    seller_id: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[str] = None
    brand_id: Optional[str] = None
    model: Optional[str] = None
    sku: Optional[str] = None
    barcode: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    old_price: Optional[float] = None
    stock: Optional[int] = None
    availability: Optional[str] = None
    condition: Optional[str] = None
    location: Optional[str] = None
    warranty: Optional[str] = None
    delivery: Optional[str] = None
    specifications: Optional[Dict[str, Any]] = None
    images: Optional[List[str]] = None
    status: Optional[str] = None # DRAFT, PENDING_APPROVAL

class ProductOut(BaseModel):
    id: str
    seller_id: str
    seller_name: Optional[str] = None
    seller_rating: Optional[float] = None
    category_id: Optional[str] = None
    category_name: Optional[str] = None
    brand_id: Optional[str] = None
    brand_name: Optional[str] = None
    name: str
    slug: str
    model: Optional[str] = None
    sku: Optional[str] = None
    barcode: Optional[str] = None
    description: Optional[str] = None
    price: float
    old_price: Optional[float] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    sellers_count: Optional[int] = 1
    currency: str
    stock: int
    availability: str
    condition: str
    location: str
    warranty: Optional[str] = None
    delivery: Optional[str] = None
    specifications: Optional[Dict[str, Any]] = None
    status: str
    created_at: datetime
    updated_at: datetime
    images: List[ProductImageOut] = []

    class Config:
        from_attributes = True

# Market stats schema computed directly from real database
class MarketStatsOut(BaseModel):
    has_data: bool
    lowest_price: Optional[float] = None
    highest_price: Optional[float] = None
    average_price: Optional[float] = None
    median_price: Optional[float] = None
    price_range: Optional[float] = None
    seller_count: int = 0
    price_deviation: Optional[float] = None
    price_change_percent_30d: Optional[float] = None
    message: Optional[str] = None

class ProductDetailOut(BaseModel):
    product: ProductOut
    price_history: List[PriceHistoryOut]
    market_stats: MarketStatsOut
    other_offers: List[Dict[str, Any]] = []

# Price alert
class PriceAlertCreate(BaseModel):
    product_id: str
    target_price: float = Field(..., gt=0)

class PriceAlertOut(BaseModel):
    id: str
    product_id: str
    product_name: Optional[str]
    product_price: Optional[float]
    target_price: float
    is_active: bool
    triggered: bool
    triggered_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

# AI Market Analysis
class AIAnalysisRequest(BaseModel):
    product_id: str

class AIAnalysisOut(BaseModel):
    product_id: str
    status: str # SUCCESS, INSUFFICIENT_DATA, ERROR
    analysis_text: str
    verdict: Optional[str] = "FAIR_PRICE" # BUY_NOW, WAIT, FAIR_PRICE
    recommendation: Optional[str] = None
    model_name: Optional[str] = "Milliy Narx AI"
    generated_at: datetime
    metrics_used: Dict[str, Any]

# AI Chat & Advisor
class AIChatMessage(BaseModel):
    role: str # user, assistant, system
    content: str

class AIChatRequest(BaseModel):
    message: str
    history: Optional[List[AIChatMessage]] = []
    product_id: Optional[str] = None

class AIChatProductSuggestion(BaseModel):
    id: str
    name: str
    price: float
    brand: Optional[str] = None
    image_url: Optional[str] = None
    seller_name: Optional[str] = None

class AIChatResponse(BaseModel):
    reply: str
    suggested_products: List[AIChatProductSuggestion] = []
    session_title: Optional[str] = None
    model_used: str = "Milliy Narx AI"
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class AIMarketSummaryOut(BaseModel):
    summary: str
    key_highlights: List[str] = []
    model_used: str = "Milliy Narx AI"
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Admin Real Metrics
class AdminMetricsOut(BaseModel):
    total_users: int
    total_sellers: int
    total_buyers: int
    total_products: int
    active_products: int
    pending_sellers: int
    pending_products: int
    total_searches: int
    total_revenue: float
    active_subscriptions: int

# Taxonomy schemas
class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=2)
    icon: Optional[str] = "Box"
    description: Optional[str] = None
    parent_id: Optional[str] = None

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    icon: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[str] = None
    is_active: Optional[bool] = None

class BrandCreate(BaseModel):
    name: str = Field(..., min_length=2)
    logo_url: Optional[str] = None

class BrandUpdate(BaseModel):
    name: Optional[str] = None
    logo_url: Optional[str] = None
    is_active: Optional[bool] = None

# User Profile schemas
class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., min_length=6)
    new_password: str = Field(..., min_length=6)
