import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.ai_service import _get_access_token, _model_candidates
from app.config import settings
import requests
import json

raw_text = "Mening ismim Alisher. Iltimos, menga 2023-01-01 dan 2023-12-31 gacha bo'lgan tranzaksiya tariximni yuboring."

rules_text = "- Pattern: passport seriyasi | Basis: Shaxsga doir ma'lumotlar to'g'risidagi qonun\n- Pattern: bank siri | Basis: Bank siri to'g'risidagi normativ talablar\n- Pattern: tergov siri | Basis: JPK va maxfiylik bo'yicha talablar"

prompt = (
    "Siz compliance ekspertsiz. Quyidagi hujjat mazmuni davlat organiga yuborilishi mumkinmi tekshiring. "
    "Qoidalarga zid bo'lsa NOT_ALLOWED, aks holda ALLOWED deb javob bering. "
    "Javobingiz faqat va faqat yalang JSON formatda bo'lishi shart. Hech qanday markdown (```json) yoki qo'shimcha so'zlar ishlata ko'rmang.\n"
    "{\"decision\":\"ALLOWED|NOT_ALLOWED\",\"reason\":string,\"legal_reference\":string,"
    "\"formatted_reply\":string}.\n"
    "Rules:\n"
    f"{rules_text}\n\n"
    "Document:\n"
    f"{raw_text[:6000]}"
)

token = _get_access_token()
payload = {
    "contents": [{"role": "user", "parts": [{"text": prompt}]}],
    "generationConfig": {"temperature": 0.1, "maxOutputTokens": 8192},
}
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
endpoint = (
    f"https://{settings.gcp_region}-aiplatform.googleapis.com/v1/"
    f"projects/{settings.gcp_project}/locations/{settings.gcp_region}/"
    f"publishers/google/models/gemini-2.5-flash:generateContent"
)
response = requests.post(endpoint, headers=headers, json=payload, timeout=30)
print(json.dumps(response.json(), indent=2))
