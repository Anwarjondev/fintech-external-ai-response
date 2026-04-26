import subprocess
import os

docx_path = "/home/anvarjon/fintech-hackathon/fintech-external-ai-response/backend/test_doc.docx"
# Create a dummy docx if not exists
if not os.path.exists(docx_path):
    from docx import Document
    doc = Document()
    doc.add_paragraph("Test document for PDF conversion.")
    doc.save(docx_path)

output_dir = "/home/anvarjon/fintech-hackathon/fintech-external-ai-response/backend/generated_docs"
os.makedirs(output_dir, exist_ok=True)

print("Starting conversion...")
try:
    res = subprocess.run([
        "libreoffice", "--headless", "--convert-to", "pdf", 
        "--outdir", output_dir, docx_path
    ], capture_output=True, text=True)
    print("STDOUT:", res.stdout)
    print("STDERR:", res.stderr)
    if res.returncode == 0:
        print("Success!")
    else:
        print("Failed!")
except Exception as e:
    print("Error:", e)
