import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from backend.app.core.config import settings
from backend.app.api.auth import get_current_user
from backend.app.db.models import User

router = APIRouter(prefix="/uploads", tags=["uploads"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

@router.post("")
async def upload_file(
    file: UploadFile = File(...)
):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Faqat ruxsat berilgan rasm formatlari: {', '.join(ALLOWED_EXTENSIONS)}"
        )
        
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    unique_name = f"{uuid.uuid4()}{ext}"
    destination_path = os.path.join(settings.UPLOAD_DIR, unique_name)
    
    # Read and validate size
    content = await file.read()
    if len(content) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"Fayl hajmi {settings.MAX_UPLOAD_SIZE_MB}MB dan oshmasligi kerak"
        )
        
    with open(destination_path, "wb") as f:
        f.write(content)
        
    # Return path accessible via FastAPI static files mount
    return {
        "url": f"/uploads/{unique_name}",
        "filename": unique_name,
        "size": len(content)
    }
