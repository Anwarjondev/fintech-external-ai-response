from app.db import SessionLocal
from app.models import DocumentRequest, AuditLog
import json

db = SessionLocal()
try:
    # Get the latest request
    req = db.query(DocumentRequest).order_by(DocumentRequest.id.desc()).first()
    if req:
        print(f"Request ID: {req.id}")
        print(f"Status: {req.compliance_status}")
        print(f"Reason: {req.compliance_reason}")
        print(f"AI Summary: {req.ai_summary}")
        
        print("\nAudit Logs:")
        logs = db.query(AuditLog).filter(AuditLog.request_id == req.id).order_by(AuditLog.id).all()
        for log in logs:
            print(f"[{log.action}] {log.details}")
            
    else:
        print("No requests found.")
finally:
    db.close()
