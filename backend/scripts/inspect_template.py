from docx import Document
import os

template_path = "/home/anvarjon/fintech-hackathon/fintech-external-ai-response/backend/bank_response_template-2.docx"
if os.path.exists(template_path):
    doc = Document(template_path)
    print("Paragraphs in template:")
    for i, p in enumerate(doc.paragraphs):
        print(f"{i}: {p.text}")
else:
    print("Template not found!")
