import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.ai_service import _call_gemini

prompt = "Bosh o'zbekistonning poytaxti qayer? Faqat JSON qaytar. Schema: {\"poytaxt\": string}"
res = _call_gemini(prompt)
print("RAW RESULT:")
print(repr(res))
