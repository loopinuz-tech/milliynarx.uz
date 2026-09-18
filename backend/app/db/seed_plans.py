"""
Seed script for Subscription Plans according to official Monetization Model.
Plans:
1. START: $10/mo
2. BUSINESS: $30/mo
3. PRO: $60/mo
"""
from backend.app.db.session import SessionLocal
from backend.app.db.models import SubscriptionPlan

def seed_subscription_plans():
    db = SessionLocal()
    try:
        plans_data = [
            {
                "tier": "START",
                "name": "Start",
                "price_monthly": 10.0,
                "is_active": True,
                "features": {
                    "price_usd": "$10/oy",
                    "price_uzs": "125 000 so'm/oy",
                    "badge_color": "emerald",
                    "catalog": "✓",
                    "comparison": "✓",
                    "region_prices": "✓",
                    "price_history": "30 kun",
                    "demand_supply": "Basic + AI",
                    "price_alerts": "5 ta",
                    "supplier_search": "✓",
                    "market_reports": "—",
                    "excel_export": "—",
                    "api": "—",
                    "ai_assistant": "✓",
                    "team_seats": "1",
                    "support": "Standard"
                }
            },
            {
                "tier": "BUSINESS",
                "name": "Business",
                "price_monthly": 30.0,
                "is_active": True,
                "features": {
                    "price_usd": "$30/oy",
                    "price_uzs": "375 000 so'm/oy",
                    "badge_color": "blue",
                    "catalog": "✓",
                    "comparison": "✓",
                    "region_prices": "✓",
                    "price_history": "1 yil",
                    "demand_supply": "Advanced + AI",
                    "price_alerts": "30 ta",
                    "supplier_search": "✓",
                    "market_reports": "✓",
                    "excel_export": "✓",
                    "api": "—",
                    "ai_assistant": "✓",
                    "team_seats": "5",
                    "support": "Priority"
                }
            },
            {
                "tier": "PRO",
                "name": "Pro",
                "price_monthly": 60.0,
                "is_active": True,
                "features": {
                    "price_usd": "$60/oy",
                    "price_uzs": "750 000 so'm/oy",
                    "badge_color": "purple",
                    "catalog": "✓",
                    "comparison": "✓",
                    "region_prices": "✓",
                    "price_history": "Cheksiz",
                    "demand_supply": "Professional + AI",
                    "price_alerts": "Cheksiz",
                    "supplier_search": "✓",
                    "market_reports": "✓ + AI",
                    "excel_export": "✓",
                    "api": "✓",
                    "ai_assistant": "✓ Advanced",
                    "team_seats": "15",
                    "support": "Dedicated"
                }
            }
        ]

        for p_info in plans_data:
            existing = db.query(SubscriptionPlan).filter(SubscriptionPlan.tier == p_info["tier"]).first()
            if not existing:
                plan = SubscriptionPlan(
                    tier=p_info["tier"],
                    name=p_info["name"],
                    price_monthly=p_info["price_monthly"],
                    features=p_info["features"],
                    is_active=True
                )
                db.add(plan)
            else:
                existing.name = p_info["name"]
                existing.price_monthly = p_info["price_monthly"]
                existing.features = p_info["features"]
                existing.is_active = True
        
        db.commit()
        print("Successfully seeded 3 official Monetization Model plans into database!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_subscription_plans()
