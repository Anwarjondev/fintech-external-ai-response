from contextlib import asynccontextmanager
import json
import os

from fastapi import Depends, FastAPI, File, HTTPException, Request, UploadFile, status
from sqlalchemy.orm import Session

from app.config import settings
from app.db import Base, engine, get_db
from app.models import AuditLog, ComplianceRule, DocumentRequest, User
from app.schemas import UploadResponse
from app.services.ai_service import classify_document, compliance_check, extract_data_request
from app.services.compliance_service import local_rule_check
from app.services.parser_service import UnsupportedFileTypeError, extract_text
from app.services.user_data_service import lookup_user_data, seed_sample_user_data


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    _seed_rules()
    _seed_user_data()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)


def _seed_rules() -> None:
    db = next(get_db())
    try:
        existing = db.query(ComplianceRule).count()
        if existing > 0:
            return
        db.add_all(
            [
                ComplianceRule(
                    rule_name="Shaxsiy ma'lumotlarni oshkor qilmaslik",
                    prohibited_pattern="passport seriyasi",
                    legal_basis="Shaxsga doir ma'lumotlar to'g'risidagi qonun",
                ),
                ComplianceRule(
                    rule_name="Bank siri himoyasi",
                    prohibited_pattern="bank siri",
                    legal_basis="Bank siri to'g'risidagi normativ talablar",
                ),
                ComplianceRule(
                    rule_name="Tergov sirlari",
                    prohibited_pattern="tergov siri",
                    legal_basis="JPK va maxfiylik bo'yicha talablar",
                ),
            ]
        )
        db.commit()
    finally:
        db.close()


def _seed_user_data() -> None:
    db = next(get_db())
    try:
        seed_sample_user_data(db)
    finally:
        db.close()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name}


def process_content(db: Session, filename: str, source_type: str, raw_text: str) -> tuple[DocumentRequest, dict | None]:
    request_row = DocumentRequest(
        source_filename=filename,
        source_type=source_type,
        raw_text=raw_text,
        compliance_status="PENDING",
    )
    db.add(request_row)
    db.commit()
    db.refresh(request_row)

    db.add(
        AuditLog(
            request_id=request_row.id,
            action="CONTENT_RECEIVED",
            details=f"Source: {source_type}, Filename: {filename}",
        )
    )
    db.commit()

    cls = classify_document(raw_text)
    request_row.topic = cls.get("topic")
    request_row.risk_level = cls.get("risk_level")
    request_row.deadline_days = cls.get("deadline_days")
    request_row.ai_summary = cls.get("summary")
    request_row.organization = cls.get("sender_organization") or "Noma'lum"
    db.commit()

    db.add(
        AuditLog(
            request_id=request_row.id,
            action="AI_CLASSIFICATION",
            details=f"topic={request_row.topic}, risk={request_row.risk_level}",
        )
    )
    db.commit()

    rules = db.query(ComplianceRule).all()
    local_ok, local_reason, local_basis = local_rule_check(raw_text, rules)

    ai_result = compliance_check(
        raw_text=raw_text,
        rules=[
            {"prohibited_pattern": rule.prohibited_pattern, "legal_basis": rule.legal_basis}
            for rule in rules
        ],
    )

    decision = ai_result.get("decision", "NOT_ALLOWED")
    reason = ai_result.get("reason", "Aniq sabab ko'rsatilmagan")
    legal_reference = ai_result.get("legal_reference", "N/A")
    response_text = ai_result.get("formatted_reply", "")

    if not local_ok:
        decision = "NOT_ALLOWED"
        reason = local_reason
        legal_reference = local_basis
        response_text = (
            "Mazkur murojaat bo'yicha hujjatni davlat organiga yuborish mumkin emas. "
            "Iltimos, yuridik bo'lim tomonidan qo'lda tekshiruvdan o'tkazing."
        )

    retrieved_data: dict | None = None
    if decision == "ALLOWED":
        data_query = extract_data_request(raw_text)
        retrieved_data = lookup_user_data(db, data_query)

        if retrieved_data.get("found"):
            query = retrieved_data.get("query", {})
            df = query.get("date_from", "N/A")
            dt = query.get("date_to", "N/A")
            response_text = (
                f"{response_text}\n\n"
                f"Siz so'ragan ma'lumotlar {df} dan {dt} gacha bo'lgan davrni o'z ichiga oladi."
            )
        else:
            response_text = (
                "So'rov qonuniy jihatdan mumkin, lekin foydalanuvchi yoki ma'lumot topilmadi. "
                "Iltimos, foydalanuvchi F.I.Sh ni aniq kiriting."
            )

        db.add(
            AuditLog(
                request_id=request_row.id,
                action="DATA_LOOKUP",
                details=f"query={json.dumps(data_query, ensure_ascii=True)}",
            )
        )
        db.commit()

    request_row.compliance_status = decision
    request_row.compliance_reason = reason
    request_row.legal_reference = legal_reference
    request_row.generated_response = response_text
    request_row.retrieved_data_json = json.dumps(retrieved_data, ensure_ascii=True) if retrieved_data else None
    db.commit()

    db.add(
        AuditLog(
            request_id=request_row.id,
            action="COMPLIANCE_DECISION",
            details=f"decision={decision}; reason={reason}",
        )
    )
    db.commit()

    return request_row, retrieved_data


from app.services.auth_service import check_role, create_access_token, get_current_user, verify_password
from app.schemas import LoginRequest, Token, UploadResponse, UserRead, OrganizationHistory

@app.post("/api/v1/auth/login", response_model=Token)
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone == login_data.phone).first()
    if not user or not user.password_hash or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Telefon raqam yoki parol xato",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.phone})
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/api/v1/auth/me", response_model=UserRead)
async def get_me(user: User = Depends(get_current_user)):
    return user


@app.get("/api/v1/statistics/history", response_model=list[OrganizationHistory])
async def get_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from sqlalchemy import func
    results = db.query(
        DocumentRequest.organization,
        func.count(DocumentRequest.id),
        func.array_agg(DocumentRequest.source_filename)
    ).group_by(DocumentRequest.organization).all()
    
    history = []
    for org, total_count, filenames in results:
        unique_files = list(set(filenames)) if filenames else []
        history.append(OrganizationHistory(
            organization=org or "Noma'lum",
            file_count=len(unique_files),
            files=unique_files
        ))
    return history


@app.post("/api/v1/documents/upload", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role("GOVERNMENT_OFFICER")),
) -> UploadResponse:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Fayl nomi bo'sh")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Fayl bo'sh")

    try:
        source_type, raw_text = extract_text(file.filename, content)
    except UnsupportedFileTypeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Parsing xatosi: {exc}") from exc

    if not raw_text:
        raise HTTPException(status_code=400, detail="Fayldan matn ajratib bo'lmadi")

    request_row, retrieved_data = process_content(db, file.filename, source_type, raw_text)
    request_row.created_by_id = current_user.id
    request_row.organization = current_user.organization
    db.commit()

    return UploadResponse(
        request_id=request_row.id,
        source_filename=request_row.source_filename,
        topic=request_row.topic,
        risk_level=request_row.risk_level,
        deadline_days=request_row.deadline_days,
        decision=request_row.compliance_status,
        legal_reference=request_row.legal_reference,
        reason=request_row.compliance_reason,
        response_text=request_row.generated_response,
        retrieved_data=retrieved_data,
    )


from app.schemas import TextInput, ApproveRequest

@app.post(
    "/api/v1/documents/text", 
    response_model=UploadResponse,
    openapi_extra={
        "requestBody": {
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "text": {"type": "string", "description": "Murojaat matni"}
                        },
                        "required": ["text"]
                    }
                }
            }
        }
    }
)
async def process_text(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role("GOVERNMENT_OFFICER")),
) -> UploadResponse:
    content_type = request.headers.get("Content-Type", "")
    raw_text = ""

    if "application/json" in content_type:
        try:
            # Standard JSON parsing
            body = await request.json()
            raw_text = body.get("text", "")
        except Exception:
            # Fallback for malformed JSON (e.g. literal newlines)
            body_bytes = await request.body()
            body_str = body_bytes.decode("utf-8", errors="ignore")
            
            # Robust extraction of the "text" field content
            import re
            # Match everything between "text":" and the last " in the string
            match = re.search(r'"text"\s*:\s*"(.*)"', body_str, re.DOTALL)
            if match:
                raw_text = match.group(1)
            else:
                raw_text = body_str
    else:
        # Fallback for non-JSON or raw text
        body_bytes = await request.body()
        raw_text = body_bytes.decode("utf-8", errors="ignore")

    if not raw_text or not raw_text.strip():
        raise HTTPException(status_code=400, detail="Matn bo'sh")

    request_row, retrieved_data = process_content(db, "text_input.txt", "text", raw_text)
    request_row.created_by_id = current_user.id
    request_row.organization = current_user.organization
    db.commit()

    return UploadResponse(
        request_id=request_row.id,
        source_filename=request_row.source_filename,
        topic=request_row.topic,
        risk_level=request_row.risk_level,
        deadline_days=request_row.deadline_days,
        decision=request_row.compliance_status,
        legal_reference=request_row.legal_reference,
        reason=request_row.compliance_reason,
        response_text=request_row.generated_response,
        retrieved_data=retrieved_data,
    )


@app.post("/api/v1/documents/{request_id}/approve")
async def approve_document(
    request_id: int,
    approve_data: ApproveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(check_role("BANK_OFFICER")),
):
    request_row = db.query(DocumentRequest).filter(DocumentRequest.id == request_id).first()
    if not request_row:
        raise HTTPException(status_code=404, detail="Murojaat topilmadi")

    if not approve_data.is_approved:
        raise HTTPException(status_code=400, detail="Murojaat tasdiqlanmagan (is_approved=false). Fayl yaratilmadi.")

    from app.services.template_service import fill_bank_template
    from fastapi.responses import FileResponse

    convert_to_pdf = (approve_data.format.lower() == "pdf")
    
    # Use database data as base
    db_retrieved_data = json.loads(request_row.retrieved_data_json) if request_row.retrieved_data_json else None
    
    # Override with frontend data if provided
    final_topic = approve_data.topic or request_row.topic
    final_response_text = approve_data.response_text or request_row.generated_response
    
    # If the user sent nested data (like from Swagger examples), try to flatten it
    sent_data = approve_data.retrieved_data
    if sent_data and "additionalProp1" in sent_data:
        sent_data = sent_data["additionalProp1"]
        
    final_retrieved_data = sent_data if sent_data is not None else db_retrieved_data
    
    user_name = None
    if final_retrieved_data and final_retrieved_data.get("user"):
        user_name = final_retrieved_data["user"].get("full_name")
    
    template_data = {
        "request_id": request_row.id,
        "topic": final_topic,
        "user_name": user_name,
        "organization": request_row.organization,
        "response_text": final_response_text,
        "legal_reference": request_row.legal_reference,
        "retrieved_data": final_retrieved_data
    }
    
    generated_file_path = fill_bank_template(template_data, convert_to_pdf=convert_to_pdf)
    
    return FileResponse(
        path=generated_file_path,
        filename=os.path.basename(generated_file_path),
        media_type="application/pdf" if convert_to_pdf else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
