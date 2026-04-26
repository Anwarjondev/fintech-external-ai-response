# Legal Response System (Monolith MVP)

Ushbu loyiha davlat organlari (Prokuratura, Soliq qo'mitasi, Markaziy bank) so'rovlariga avtomatlashtirilgan tarzda huquqiy javoblar tayyorlovchi **Monolith MVP** backend tizimidir.

## 🚀 Asosiy Imkoniyatlar

-   **Hujjatlarni qayta ishlash**: PDF va DOCX formatidagi so'rovlarni qabul qilish va matnni ajratib olish (Parsing).
-   **AI Klassifikatsiya**: Murojaat mavzusi, xavf darajasi (Risk level), muddat va jo'natuvchi tashkilotni aniqlash.
-   **Compliance Tekshiruvi**: Markaziy bank va ichki qoidalar asosida so'rovning qonuniyligini tekshirish.
-   **Ma'lumotlarni ajratish**: So'rov ichidan kerakli user ma'lumotlarini (ism, tranzaksiya turi, sana) AI orqali ajratib olish.
-   **Avtomatik Javob Drafti**: Tizim ruxsat bergan hollarda (`ALLOWED`), rasmiy bank formati asosida tayyor javob loyihasini (DOCX) generatsiya qilish.
-   **Audit Log**: Barcha jarayonlarni ma'lumotlar bazasida qayd etib borish.

## 🛠 Texnologiyalar

-   **Backend**: FastAPI (Python 3.10+)
-   **Database**: SQLAlchemy (SQLite MVP uchun, PostgreSQL production uchun)
-   **AI Engine**: Google Vertex AI (Gemini 2.0 Flash)
-   **Auth**: JWT (OAuth2 Password Bearer)
-   **Docs Generation**: `python-docx`
-   **Containerization**: Docker & Docker Compose

## 📦 O'rnatish va Ishga tushirish

### 1. Lokal muhitni tayyorlash

```bash
# Loyihaga o'ting
cd backend

# Virtual muhit yaratish
python3 -m venv .venv
source .venv/bin/activate

# Bog'liqliklarni o'rnatish
pip install -r requirements.txt
```

### 2. Konfiguratsiya (.env)

`.env.example` faylidan nusxa oling va o'z ma'lumotlaringizni kiriting:

```bash
cp .env.example .env
```

Muhim o'zgaruvchilar:
-   `GCP_PROJECT`: Google Cloud loyiha IDsi.
-   `GOOGLE_APPLICATION_CREDENTIALS`: Service Account JSON fayli yo'li.
-   `DATABASE_URL`: Ma'lumotlar bazasi manzili.

### 3. Serverni ishga tushirish

```bash
uvicorn app.main:app --reload
```

Server ishga tushgach, hujjatlarni [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) (Swagger) orqali ko'rish mumkin.

## 📂 Loyiha Strukturasi

-   `app/`: Asosiy dastur kodi.
    -   `api/`: API routerlar.
    -   `services/`: Biznes mantiq (AI, DB, Template).
    -   `models.py`: Ma'lumotlar bazasi modellari.
    -   `config.py`: Konfiguratsiya sozlamalari.
-   `scripts/`: Test va yordamchi skriptlar.
-   `generated_docs/`: Generatsiya qilingan javob fayllari saqlanadigan joy.
-   `bank_response_template-2.docx`: Rasmiy javob formati (template).

## 🛡 Xavfsizlik

-   Production muhitda `DATABASE_URL` sifatida PostgreSQL tavsiya etiladi.
-   Service account JSON faylini hech qachon git'ga yuklamang! (`.gitignore` ga kiritilgan).

---
*Fintech Hackathon 2026 uchun maxsus tayyorlandi.*
