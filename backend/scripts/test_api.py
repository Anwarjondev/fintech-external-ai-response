import os
import sys
import httpx
from docx import Document
import time
import subprocess

doc = Document()
doc.add_paragraph("Mening ismim Alisher. Iltimos, menga 2023-01-01 dan 2023-12-31 gacha bo'lgan tranzaksiya tariximni yuboring.")
doc.save("test_api_doc.docx")

# Start server
server = subprocess.Popen(
    ["source .venv/bin/activate && uvicorn app.main:app --port 8001"], 
    shell=True, 
    stdout=subprocess.PIPE, 
    stderr=subprocess.PIPE,
    cwd="/home/anvarjon/fintech-hackathon/fintech-external-ai-response/backend"
)

time.sleep(3) # Wait for server to start

try:
    with open("test_api_doc.docx", "rb") as f:
        response = httpx.post(
            "http://localhost:8001/api/v1/documents/upload",
            files={"file": ("test_api_doc.docx", f, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
            timeout=60.0
        )
    print(f"Status Code: {response.status_code}")
    import json
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print("Error:", e)
finally:
    server.terminate()
