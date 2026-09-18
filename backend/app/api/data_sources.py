from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.db.models import DataSource, User
from backend.app.api.auth import require_role

router = APIRouter(prefix="/data-sources", tags=["data-sources"])

@router.get("")
def get_data_sources(db: Session = Depends(get_db)):
    sources = db.query(DataSource).all()
    if not sources:
        # Initial seed if table empty
        seed = [
            ("Uzum Market", "UZUM", "NOT_CONFIGURED"),
            ("Yandex Market", "YANDEX_MARKET", "NOT_CONFIGURED"),
            ("Ozon", "OZON", "NOT_CONFIGURED"),
            ("Wildberries", "WILDBERRIES", "NOT_CONFIGURED"),
            ("Tasdiqlangan sotuvchilar (Manual)", "MANUAL_SELLER", "CONNECTED")
        ]
        for name, code, st in seed:
            db.add(DataSource(name=name, adapter_code=code, status=st))
        db.commit()
        sources = db.query(DataSource).all()

    return [
        {
            "id": s.id,
            "name": s.name,
            "adapter_code": s.adapter_code,
            "status": s.status,
            "last_sync_at": s.last_sync_at,
            "error_message": s.error_message,
            "updated_at": s.updated_at
        } for s in sources
    ]

@router.patch("/{source_id}/status")
def update_data_source_status(
    source_id: str,
    status_val: str = Query(..., pattern="^(CONNECTED|DISCONNECTED|NOT_CONFIGURED|ERROR)$"),
    error_message: Optional[str] = None,
    admin_user: User = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    ds = db.query(DataSource).filter(DataSource.id == source_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Manba topilmadi")
    ds.status = status_val
    ds.error_message = error_message
    ds.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Manba holati yangilandi", "status": ds.status}
