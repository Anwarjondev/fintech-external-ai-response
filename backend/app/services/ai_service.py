import json
import logging
import os
from datetime import datetime
from typing import Any

import google.auth
from google.auth.exceptions import DefaultCredentialsError
import requests
from google.auth.transport.requests import Request
from google.oauth2 import service_account

from app.config import settings


logger = logging.getLogger(__name__)


def _get_access_token() -> str:
    if not settings.gcp_project.strip():
        raise ValueError("GCP project is missing. Set GCP_PROJECT environment variable.")

    scopes = ["https://www.googleapis.com/auth/cloud-platform"]
    credentials = None
    credentials_file = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "").strip()

    # Keep backward compatibility with legacy env var while preferring ADC.
    if not credentials_file:
        credentials_file = settings.gcp_service_account_file.strip()

    try:
        if credentials_file:
            credentials = service_account.Credentials.from_service_account_file(
                credentials_file,
                scopes=scopes,
            )
        else:
            credentials, _ = google.auth.default(scopes=scopes)
    except FileNotFoundError as exc:
        raise RuntimeError(
            "Google credentials file was not found. Set GOOGLE_APPLICATION_CREDENTIALS to a valid JSON key file."
        ) from exc
    except DefaultCredentialsError as exc:
        raise RuntimeError(
            "Google credentials were not found. Set GOOGLE_APPLICATION_CREDENTIALS or run 'gcloud auth application-default login'."
        ) from exc

    credentials.refresh(Request())
    if not credentials.token:
        raise RuntimeError("Could not obtain Google access token from configured credentials.")

    return credentials.token


def _model_candidates() -> list[str]:
    configured = settings.vertex_model_name.strip() or "gemini-2.0-flash"
    candidates = [configured]

    configured_fallbacks = [
        name.strip()
        for name in settings.gcp_model_fallbacks.split(",")
        if name.strip()
    ]
    candidates.extend(configured_fallbacks)

    # Migrate old model family usage to currently supported aliases.
    if configured.startswith("gemini-1.5-"):
        candidates.extend([
            "gemini-2.5-flash",
            "gemini-2.5-flash-lite",
            "gemini-2.0-flash",
            "gemini-2.0-flash-lite",
        ])

    # De-duplicate while preserving order.
    return list(dict.fromkeys(candidates))


def _call_gemini(prompt: str) -> str:
    try:
        token = _get_access_token()
    except (ValueError, RuntimeError) as exc:
        logger.error("Gemini auth/config error: %s", exc)
        return ""

    payload = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 8192},
    }
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    response = None
    model_used = settings.vertex_model_name

    for model_name in _model_candidates():
        model_used = model_name
        endpoint = (
            f"https://{settings.gcp_region}-aiplatform.googleapis.com/v1/"
            f"projects/{settings.gcp_project}/locations/{settings.gcp_region}/"
            f"publishers/google/models/{model_name}:generateContent"
        )
        try:
            response = requests.post(endpoint, headers=headers, json=payload, timeout=120)
        except requests.RequestException as exc:
            logger.warning("Gemini request failed before response: %s", exc)
            return ""

        if response.ok:
            break

        if response.status_code == 404:
            logger.warning(
                "Gemini model not found or not accessible: %s (status=%s)",
                model_name,
                response.status_code,
            )
            continue

        logger.warning(
            "Gemini request failed: model=%s status=%s body=%s",
            model_name,
            response.status_code,
            response.text[:500],
        )
        return ""

    if response is None or not response.ok:
        logger.warning(
            "Gemini request failed for all model candidates. configured_model=%s",
            settings.vertex_model_name,
        )
        return ""

    try:
        body = response.json()
    except ValueError:
        logger.warning("Gemini response is not JSON")
        return ""

    if model_used != settings.vertex_model_name:
        logger.info("Gemini fallback model used: %s", model_used)

    candidates = body.get("candidates") or []
    if not candidates:
        return ""
    parts = candidates[0].get("content", {}).get("parts", [])
    if not parts:
        return ""
    
    result_text = parts[0].get("text", "")
    
    # Debug log
    log_path = "/home/anvarjon/fintech-hackathon/fintech-external-ai-response/backend/gemini_debug.log"
    try:
        with open(log_path, "a") as f:
            f.write(f"\n--- {datetime.now()} ---\nPROMPT: {prompt}\nRESULT: {result_text}\n")
        logger.info(f"Log written to {log_path}")
    except Exception as e:
        logger.error(f"Failed to write debug log: {e}")
        
    return result_text


def classify_document(raw_text: str) -> dict[str, Any]:
    prompt = (
        "Siz bank yuridik assistentisiz. Quyidagi murojaat matnini tahlil qiling.\n"
        "Javobingiz faqat va faqat yalang JSON formatda bo'lishi shart. Hech qanday markdown (```json) yoki qo'shimcha so'zlar ishlata ko'rmang.\n"
        "Schema: {\"topic\":string,\"risk_level\":\"LOW|MEDIUM|HIGH\","
        "\"deadline_days\":int,\"summary\":string,\"sender_organization\":string}.\n"
        "Murojaat:\n"
        f"{raw_text[:6000]}"
    )
    result = _call_gemini(prompt)
    return _safe_parse_json(result, default={
        "topic": "Noma'lum",
        "risk_level": "MEDIUM",
        "deadline_days": 3,
        "summary": "AI klassifikatsiya muvaffaqiyatsiz bo'ldi",
        "sender_organization": "Noma'lum Tashkilot"
    })


def compliance_check(raw_text: str, rules: list[dict[str, str]]) -> dict[str, Any]:
    rules_text = "\n".join(
        [
            f"- Pattern: {rule['prohibited_pattern']} | Basis: {rule['legal_basis']}"
            for rule in rules
        ]
    )
    prompt = (
        "Siz bank compliance ekspertsiz. Quyidagi hujjat mazmunini tekshiring.\n"
        "1. Agar mijoz O'ZINING ma'lumotlarini so'rayotgan bo'lsa (masalan: 'Mening tranzaksiyalarimni bering'), bu har doim ALLOWED.\n"
        "2. Agar so'rov Davlat Soliq Idorasi, Prokuratura, IIV kabi rasmiy organlardan kelayotgan bo'lsa va unda aniq bir jismoniy shaxs (masalan: Anvarjon Karimov) haqida ma'lumot so'ralgan bo'lsa, bu ham ALLOWED (ruxsat etilgan) deb hisoblansin. Chunki bank tizimida bunday so'rovlar rasmiy hisoblanadi.\n"
        "3. Faqatgina qoidalarga mutlaqo zid bo'lgan (shubhali uchinchi shaxslar so'rovi) holatlarda NOT_ALLOWED deb javob bering.\n"
        "Javobingiz faqat va faqat yalang JSON formatda bo'lishi shart. Hech qanday markdown (```json) yoki qo'shimcha so'zlar ishlata ko'rmang.\n"
        "{\"decision\":\"ALLOWED|NOT_ALLOWED\",\"reason\":string,\"legal_reference\":string,"
        "\"formatted_reply\":string}.\n"
        "Rules:\n"
        f"{rules_text}\n\n"
        "Document Content:\n"
        f"{raw_text[:6000]}"
    )
    result = _call_gemini(prompt)
    return _safe_parse_json(result, default={
        "decision": "NOT_ALLOWED",
        "reason": "AI compliance tekshiruvi muvaffaqiyatsiz bo'ldi",
        "legal_reference": "Manual tekshiruv talab etiladi",
        "formatted_reply": "Murojaatga hozircha avtomatik javob tayyorlab bo'lmadi.",
    })


def extract_data_request(raw_text: str) -> dict[str, Any]:
    prompt = (
        "Quyidagi matndan foydalanuvchi ma'lumot so'rovini JSON ko'rinishida ajrating. "
        "Agar matnda sana bo'lmasa null qaytaring.\n"
        "Javobingiz faqat va faqat yalang JSON formatda bo'lishi shart. Hech qanday markdown (```json) yoki qo'shimcha so'zlar ishlata ko'rmang.\n"
        "Schema: "
        "{\"user_name\":string|null,\"request_type\":\"transactions|card_balance|credit_history\","
        "\"date_from\":\"YYYY-MM-DD\"|null,\"date_to\":\"YYYY-MM-DD\"|null}.\n"
        "Matn:\n"
        f"{raw_text[:6000]}"
    )
    result = _call_gemini(prompt)
    return _safe_parse_json(
        result,
        default={
            "user_name": None,
            "request_type": "transactions",
            "date_from": None,
            "date_to": None,
        },
    )


def _safe_parse_json(raw: str, default: dict[str, Any]) -> dict[str, Any]:
    if not raw:
        return default
        
    start = raw.find("{")
    end = raw.rfind("}")
    
    if start != -1 and end != -1 and end > start:
        cleaned = raw[start:end+1]
        try:
            parsed = json.loads(cleaned)
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError:
            pass
            
    return default
