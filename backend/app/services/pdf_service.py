import re
from pathlib import Path
from typing import List, Tuple
from pypdf import PdfReader, PdfWriter
from app.config import SHARTNOMALAR_DIR, DEFAULT_FOLDERS

def ensure_folders_exist():
    """Ensure all 20 default folders exist inside SHARTNOMALAR_DIR."""
    for folder_name in DEFAULT_FOLDERS:
        folder_path = SHARTNOMALAR_DIR / folder_name
        folder_path.mkdir(parents=True, exist_ok=True)

def parse_page_range(range_str: str, max_pages: int) -> List[int]:
    """
    Parses a page range string like "1-3, 5, 8-10" into a list of 1-based unique sorted page integers.
    Validates that page numbers are within [1, max_pages].
    """
    cleaned = range_str.strip()
    if not cleaned:
        raise ValueError("Sahifa raqamlari kiritilmadi.")

    pages = set()
    parts = [p.strip() for p in cleaned.split(",") if p.strip()]

    for part in parts:
        if "-" in part:
            subparts = part.split("-")
            if len(subparts) != 2:
                raise ValueError(f"Noto'g'ri sahifa oralig'i: '{part}'")
            try:
                start = int(subparts[0].strip())
                end = int(subparts[1].strip())
            except ValueError:
                raise ValueError(f"Sahifa raqamlari son bo'lishi kerak: '{part}'")
            if start > end:
                raise ValueError(f"Boshlang'ich sahifa oxirgisidan katta bo'lishi mumkin emas: '{part}'")
            if start < 1 or end > max_pages:
                raise ValueError(f"Sahifalar 1 va {max_pages} oralig'ida bo'lishi kerak ('{part}')")
            for p in range(start, end + 1):
                pages.add(p)
        else:
            try:
                p = int(part)
            except ValueError:
                raise ValueError(f"Noto'g'ri sahifa raqami: '{part}'")
            if p < 1 or p > max_pages:
                raise ValueError(f"Sahifa {p} umumiy sahifalar (1-{max_pages}) doirasida emas")
            pages.add(p)

    sorted_pages = sorted(list(pages))
    if not sorted_pages:
        raise ValueError("Hech qanday to'g'ri sahifa topilmadi.")
    return sorted_pages

def format_page_range_summary(pages: List[int]) -> str:
    """Creates a concise string for filename like '1-3_5_8-10'."""
    if not pages:
        return ""
    ranges = []
    start = pages[0]
    prev = pages[0]
    for p in pages[1:]:
        if p == prev + 1:
            prev = p
        else:
            if start == prev:
                ranges.append(str(start))
            else:
                ranges.append(f"{start}-{prev}")
            start = p
            prev = p
    if start == prev:
        ranges.append(str(start))
    else:
        ranges.append(f"{start}-{prev}")
    return "_".join(ranges)

def sanitize_filename(name: str) -> str:
    """Sanitize string for filename use."""
    clean = re.sub(r'[\s]+', '_', name)
    clean = re.sub(r'[^a-zA-Z0-9_\-\.]', '', clean)
    return clean[:60] if clean else "document"

def get_unique_filepath(dest_dir: Path, base_name: str, ext: str = ".pdf") -> Path:
    """Finds a non-conflicting filepath in dest_dir."""
    target = dest_dir / f"{base_name}{ext}"
    if not target.exists():
        return target
    counter = 1
    while True:
        target = dest_dir / f"{base_name}_{counter}{ext}"
        if not target.exists():
            return target
        counter += 1

def extract_pages_to_folder(
    source_pdf_path: Path,
    original_filename: str,
    target_folder_name: str,
    pages: List[int]
) -> dict:
    """
    Extracts specified 1-based pages from source_pdf_path and saves into SHARTNOMALAR_DIR / target_folder_name.
    """
    dest_dir = SHARTNOMALAR_DIR / target_folder_name
    dest_dir.mkdir(parents=True, exist_ok=True)

    reader = PdfReader(str(source_pdf_path))
    writer = PdfWriter()

    for p in pages:
        # pypdf is 0-indexed
        writer.add_page(reader.pages[p - 1])

    stem = Path(original_filename).stem
    safe_stem = sanitize_filename(stem)
    page_summary = format_page_range_summary(pages)
    base_output_name = f"{safe_stem}_pages_{page_summary}"

    dest_file = get_unique_filepath(dest_dir, base_output_name, ".pdf")
    with open(dest_file, "wb") as f_out:
        writer.write(f_out)

    file_size = dest_file.stat().st_size
    return {
        "folder": target_folder_name,
        "filename": dest_file.name,
        "path": str(dest_file),
        "pages": pages,
        "page_count": len(pages),
        "file_size": file_size,
    }
