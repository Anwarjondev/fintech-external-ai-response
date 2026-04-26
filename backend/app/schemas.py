from pydantic import BaseModel


class UploadResponse(BaseModel):
    request_id: int
    source_filename: str
    topic: str | None
    risk_level: str | None
    deadline_days: int | None
    decision: str
    legal_reference: str | None
    reason: str
    response_text: str
    retrieved_data: dict | None


class TextInput(BaseModel):
    text: str


class ApproveRequest(BaseModel):
    format: str = "pdf"  # "pdf" or "docx"
    topic: str | None = None
    response_text: str | None = None
    retrieved_data: dict | None = None
    is_approved: bool = True


class LoginRequest(BaseModel):
    phone: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class UserRead(BaseModel):
    id: int
    full_name: str
    phone: str | None
    role: str
    organization: str | None

    class Config:
        from_attributes = True


class OrganizationHistory(BaseModel):
    organization: str
    file_count: int
    files: list[str]
