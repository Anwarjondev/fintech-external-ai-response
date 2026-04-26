import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.ai_service import compliance_check

raw_text = "Mening ismim Alisher. Iltimos, menga 2023-01-01 dan 2023-12-31 gacha bo'lgan tranzaksiya tariximni yuboring."

rules = [
    {"prohibited_pattern": "passport seriyasi", "legal_basis": "Shaxsga doir ma'lumotlar to'g'risidagi qonun"},
    {"prohibited_pattern": "bank siri", "legal_basis": "Bank siri to'g'risidagi normativ talablar"},
    {"prohibited_pattern": "tergov siri", "legal_basis": "JPK va maxfiylik bo'yicha talablar"}
]

print("Testing AI compliance check with DB rules...")
res = compliance_check(raw_text, rules)
print(res)
