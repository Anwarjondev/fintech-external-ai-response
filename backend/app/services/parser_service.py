import io

from docx import Document
from pypdf import PdfReader


class UnsupportedFileTypeError(Exception):
    pass


def extract_text(filename: str, content: bytes) -> tuple[str, str]:
    lower_name = filename.lower()
    if lower_name.endswith(".pdf"):
        return "pdf", _extract_pdf_text(content)
    if lower_name.endswith(".docx"):
        return "docx", _extract_docx_text(content)
    raise UnsupportedFileTypeError("Faqat PDF va DOCX formatlari qabul qilinadi")


def _extract_pdf_text(content: bytes) -> str:
    reader = PdfReader(io.BytesIO(content))
    pages = [page.extract_text() or "" for page in reader.pages]
    return "\n".join(pages).strip()


def _extract_docx_text(content: bytes) -> str:
    document = Document(io.BytesIO(content))
    paragraphs = [p.text for p in document.paragraphs if p.text]
    return "\n".join(paragraphs).strip()
