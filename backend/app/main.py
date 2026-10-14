import uuid
import io
import zipfile
from datetime import datetime
from pathlib import Path
from typing import List
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response
from pydantic import BaseModel, Field
from pypdf import PdfReader

from app.config import SHARTNOMALAR_DIR, UPLOAD_DIR, DEFAULT_FOLDERS
from app.services.pdf_service import (
    ensure_folders_exist,
    parse_page_range,
    extract_pages_to_folder,
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure default target folders exist on startup
    ensure_folders_exist()
    yield

app = FastAPI(
    title="Shartnoma PDF Splitter API",
    description="Backend API for uploading and splitting multi-page contract PDFs into categorized folders.",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for frontend running on localhost:3000 or any origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SplitMapping(BaseModel):
    folder: str = Field(..., description="Target category folder name")
    pages: str = Field(..., description="Page numbers or ranges, e.g., '1-3, 5, 8-10'")

class SplitRequest(BaseModel):
    document_id: str
    mappings: List[SplitMapping]

@app.get("/api/health")
def health_check():
    return {"status": "ok", "folders_count": len(DEFAULT_FOLDERS)}

@app.get("/api/folders")
def get_folders():
    """Return the 20 folder categories and file count in each."""
    ensure_folders_exist()
    folder_stats = []
    for name in DEFAULT_FOLDERS:
        f_dir = SHARTNOMALAR_DIR / name
        f_dir.mkdir(parents=True, exist_ok=True)
        file_count = sum(1 for item in f_dir.glob("*.pdf") if item.is_file())
        folder_stats.append({
            "name": name,
            "file_count": file_count,
        })
    return {"folders": folder_stats}

@app.get("/api/download-zip")
def download_zipped_shartnomalar():
    """Zips the entire shartnomalar folder (all 20 subfolders) and streams it as a download."""
    ensure_folders_exist()

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for folder_name in DEFAULT_FOLDERS:
            folder_path = SHARTNOMALAR_DIR / folder_name
            folder_path.mkdir(parents=True, exist_ok=True)
            # Ensure the directory structure itself is preserved
            zip_file.writestr(f"shartnomalar/{folder_name}/", "")
            
            # Add all non-hidden files within the folder
            for file_path in folder_path.glob("*"):
                if file_path.is_file() and not file_path.name.startswith("."):
                    arcname = f"shartnomalar/{folder_name}/{file_path.name}"
                    zip_file.write(file_path, arcname=arcname)

    zip_buffer.seek(0)
    now_str = datetime.now().strftime("%Y-%m-%d_%H%M")
    filename = f"shartnomalar_{now_str}.zip"

    return Response(
        content=zip_buffer.getvalue(),
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition",
        }
    )

@app.post("/api/upload")
async def upload_pdf(file: UploadFile = File(...)):
    """Uploads a PDF file, validates it, and saves it in temporary storage."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Faqat PDF formatdagi fayllar qabul qilinadi.")

    doc_id = str(uuid.uuid4())
    stored_filename = f"{doc_id}_{file.filename}"
    file_path = UPLOAD_DIR / stored_filename

    try:
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Verify and read page count
        reader = PdfReader(str(file_path))
        total_pages = len(reader.pages)
        if total_pages < 1:
            raise HTTPException(status_code=400, detail="PDF faylida sahifalar topilmadi.")

        return {
            "document_id": doc_id,
            "filename": file.filename,
            "stored_filename": stored_filename,
            "total_pages": total_pages,
            "file_size": len(content),
        }
    except Exception as e:
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=400, detail=f"PDF faylni o'qishda xatolik yuz berdi: {str(e)}")

@app.get("/api/pdf/{document_id}")
def get_pdf_preview(document_id: str):
    """Streams uploaded PDF for client-side preview."""
    # Find matching file in UPLOAD_DIR
    matching = list(UPLOAD_DIR.glob(f"{document_id}_*"))
    if not matching:
        raise HTTPException(status_code=404, detail="PDF fayl topilmadi yoki muddati tugagan.")

    pdf_file = matching[0]
    return FileResponse(
        path=pdf_file,
        media_type="application/pdf",
        filename=pdf_file.name,
        headers={"Content-Disposition": f"inline; filename=\"{pdf_file.name}\""}
    )

@app.post("/api/split")
def split_pdf(request: SplitRequest):
    """
    Executes PDF split according to user mappings.
    Extracts pages and saves them to the corresponding folders.
    """
    matching = list(UPLOAD_DIR.glob(f"{request.document_id}_*"))
    if not matching:
        raise HTTPException(status_code=404, detail="Hujjat topilmadi. Iltimos, PDF faylni qayta yuklang.")

    pdf_file = matching[0]
    # Extract original filename by stripping the doc_id prefix
    original_filename = pdf_file.name[len(request.document_id) + 1:]

    try:
        reader = PdfReader(str(pdf_file))
        total_pages = len(reader.pages)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDFni tekshirishda xatolik: {str(e)}")

    if not request.mappings:
        raise HTTPException(status_code=400, detail="Kamida bitta bo'lim va sahifalar ko'rsatilishi kerak.")

    # Validate all mappings first before writing
    validated_jobs = []
    errors = []
    for idx, mapping in enumerate(request.mappings, start=1):
        if not mapping.folder:
            errors.append(f"{idx}-qator: Papka tanlanmagan.")
            continue
        if mapping.folder not in DEFAULT_FOLDERS:
            errors.append(f"{idx}-qator: Noma'lum papka tanlandi: {mapping.folder}")
            continue
        try:
            pages = parse_page_range(mapping.pages, total_pages)
            validated_jobs.append((mapping.folder, pages))
        except ValueError as ve:
            errors.append(f"{idx}-qator ({mapping.folder}): {str(ve)}")

    if errors:
        raise HTTPException(status_code=400, detail="\n".join(errors))

    # Process all validated jobs
    saved_files = []
    for folder_name, pages in validated_jobs:
        result = extract_pages_to_folder(
            source_pdf_path=pdf_file,
            original_filename=original_filename,
            target_folder_name=folder_name,
            pages=pages,
        )
        saved_files.append(result)

    return {
        "success": True,
        "message": f"{len(saved_files)} ta bo'lim muvaffaqiyatli ajratildi va saqlandi.",
        "results": saved_files,
    }
