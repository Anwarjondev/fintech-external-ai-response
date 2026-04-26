import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.parser_service import extract_text
from app.services.ai_service import _call_gemini
from docx import Document

doc = Document()
doc.add_paragraph("Mening ismim Alisher. Iltimos, menga 2023-01-01 dan 2023-12-31 gacha bo'lgan tranzaksiya tariximni yuboring.")
doc.save("test_doc.docx")

with open("test_doc.docx", "rb") as f:
    content = f.read()

source_type, raw_text = extract_text("test_doc.docx", content)

prompt = (
    "Siz compliance ekspertsiz. Quyidagi hujjat mazmuni davlat organiga yuborilishi mumkinmi tekshiring. "
    "Qoidalarga zid bo'lsa NOT_ALLOWED, aks holda ALLOWED deb javob bering. "
    "Faqat JSON qaytaring: "
    "{\"decision\":\"ALLOWED|NOT_ALLOWED\",\"reason\":string,\"legal_reference\":string,"
    "\"formatted_reply\":string}.\n"
    "Rules:\n"
    "- Pattern: maxfiy | Basis: qonun\n\n"
    "Document:\n"
    f"{raw_text[:6000]}"
)

print("\n--- CALL GEMINI DIRECTLY ---")
result = _call_gemini(prompt)
print(f"RAW RESULT:\n{repr(result)}\n")
