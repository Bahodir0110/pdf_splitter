# Shartnoma PDF Splitter (FastAPI + React + Docker)

Ushbu loyiha ko'p sahifali PDF shartnomalarni yuklash, ularni qulay ko'rish va sahifalarni tanlab, 20 ta tegishli papkaga avtomatik ajratib saqlash imkonini beruvchi to'liq tizimdir.

## 🚀 Ishga tushirish (Docker yordamida)

Loyihani bitta buyruq bilan Docker orqali ishga tushirish mumkin:

```bash
docker compose up --build
```

- **Frontend (React UI):** [http://localhost:3000](http://localhost:3000)
- **Backend (FastAPI Swagger Docs):** [http://localhost:8000/docs](http://localhost:8000/docs)

*Eslatma: Docker orqali ajratilgan har bir PDF fayli to'g'ridan-to'g'ri kompyuteringizdagi `./shartnomalar/` papkasiga saqlanadi (volume mount qilingan).*

---

## 🛠 Mahalliy (Local) ishga tushirish (Dockersiz)

### 1. Backend:
```bash
python3 -m venv backend/.venv
source backend/.venv/bin/activate
pip install -r backend/requirements.txt
cd backend
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend:
```bash
cd frontend
npm install
npm run dev
```

---

## 📁 20 ta Ajratiladigan Papkalar Ro'yxati (`shartnomalar/`)

1. `1. Asosiy shartnoma hujjati`
2. `2. Qo'shimcha kelishuv (10% gacha bajarilgan ish)`
3. `3. Qo'shimcha kelishuv`
4. `4. Kompleks ekspertiza markazi xulosasi`
5. `5. Nuqson dalolatnomasi`
6. `6. Tegishli faoliyat turi uchun litsenziya`
7. `7. Ishlarni bajarish jadvali`
8. `8. Moliyalashtirish jadvali`
9. `9. Manzilli ro‘yxat`
10. `10. Sug‘urta shartnomasi`
11. `11. Ekspertiza xulosasi (Shaharsozlik)`
12. `12. Qurilish uchun ruxsatnoma (GASN)`
13. `13. Texnik hujjatlar hamda texnik topshiriq (baholash mezonlari)`
14. `14. G‘olibni aniqlash bayonnomasi`
15. `15. Ikki kunlik muhokama bayonnomasi`
16. `16. Xarid qilinayotgan tovarlarni birinchi navbatda new.cooperation.uz portali mavjudligini o‘rganilganligi`
17. `17. Shaffof qurilish bayonomasi (protokol)`
18. `18. Tijorat taklifi (684-sonli qarorning 51.1-modda)`
19. `19. Huquqiy xulosa (shaffof tender)`
20. `20. Boshqalar`

---

## ✨ Imkoniyatlar va Apple Design

- **Apple Human Interface tamoyillari:** SF Pro tipografiyasi, xiralashgan shisha materiallar (`backdrop-filter`), elastik bosim hissi (`active:scale-[0.98]`), toza va tushunarli tartib.
- **Interaktiv PDF ko'rish oynasi:** Sahifalar bo'ylab tez o'tish (mini-eskizlar), yaqinlashtirish/uzoqlashtirish (Zoom), va bir marta bosish orqali joriy sahifani faol bo'limga qo'shish tugmasi (`+ Sahifa X`).
- **Ko'p bo'limli taqsimlash:** Istalgancha bo'lim qo'shish va 20 ta toifadan birini tanlash.
- **Moslashuvchan sahifa sintaksisi:** `1-3, 5, 8-10` kabi oraliqlar va ro'yxatlarni to'liq qo'llab-quvvatlaydi, kiritish jarayonida xatolarni tekshirib boradi.
- **Bitta tugma bilan saqlash:** `Barchasini ajratish va saqlash` tugmasi bir vaqtda barcha bo'limlarni pypdf yordamida tez va sifatini yo'qotmagan holda yangi PDF ko'rinishida hosil qiladi va mos papkaga joylaydi.
- **ZIP yuklab olish:** Tepadagi navigatsiya panelidagi "ZIP yuklab olish" tugmasi butun `shartnomalar/` papkasini barcha 20 ta standart kataloglari va ularga taqsimlangan PDF fayllari bilan birga bitta `.zip` arxiv qilib yuklab beradi.
