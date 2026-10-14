from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent
# In Docker, this can be mounted at /app/shartnomalar or relative to workspace
SHARTNOMALAR_DIR = Path(os.getenv("SHARTNOMALAR_DIR", BASE_DIR.parent / "shartnomalar"))
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", BASE_DIR / "temp_uploads"))

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
SHARTNOMALAR_DIR.mkdir(parents=True, exist_ok=True)

DEFAULT_FOLDERS = [
    "1. Asosiy shartnoma hujjati",
    "2. Qo'shimcha kelishuv (10% gacha bajarilgan ish)",
    "3. Qo'shimcha kelishuv",
    "4. Kompleks ekspertiza markazi xulosasi",
    "5. Nuqson dalolatnomasi",
    "6. Tegishli faoliyat turi uchun litsenziya",
    "7. Ishlarni bajarish jadvali",
    "8. Moliyalashtirish jadvali",
    "9. Manzilli ro‘yxat",
    "10. Sug‘urta shartnomasi",
    "11. Ekspertiza xulosasi (Shaharsozlik)",
    "12. Qurilish uchun ruxsatnoma (GASN)",
    "13. Texnik hujjatlar hamda texnik topshiriq (baholash mezonlari)",
    "14. G‘olibni aniqlash bayonnomasi",
    "15. Ikki kunlik muhokama bayonnomasi",
    "16. Xarid qilinayotgan tovarlarni birinchi navbatda new.cooperation.uz portali mavjudligini o‘rganilganligi",
    "17. Shaffof qurilish bayonomasi (protokol)",
    "18. Tijorat taklifi (684-sonli qarorning 51.1-modda)",
    "19. Huquqiy xulosa (shaffof tender)",
    "20. Boshqalar",
]
