from datetime import datetime

from sqlalchemy.orm import Session

from app.models import Card, CreditHistory, Transaction, User


def seed_sample_user_data(db: Session) -> None:
    if db.query(User).count() > 0:
        return

    from app.services.auth_service import get_password_hash

    # Government Officer
    gov_officer = User(
        full_name="Davlat Organi Xodimi",
        phone="+998901234567",
        password_hash=get_password_hash("gov123"),
        role="GOVERNMENT_OFFICER",
        organization="Bosh Prokuratura"
    )
    # Bank Officer
    bank_officer = User(
        full_name="Bank Mas'ul Xodimi",
        phone="+998907654321",
        password_hash=get_password_hash("bank123"),
        role="BANK_OFFICER",
        organization="Milliy Bank"
    )
    
    # More Regular Users
    anvarjon = User(full_name="Anvarjon Karimov", phone="+998901112233")
    alibek = User(full_name="Alibek Xasanov", phone="+998909998877")
    malika = User(full_name="Malika Sobirova", phone="+998903334455")
    jasur = User(full_name="Jasur Jumaboyev", phone="+998905556677")
    db.add_all([gov_officer, bank_officer, anvarjon, alibek, malika, jasur])
    db.commit()
    db.refresh(anvarjon)
    db.refresh(alibek)
    db.refresh(malika)
    db.refresh(jasur)

    db.add_all(
        [
            Card(user_id=anvarjon.id, card_number_masked="8600********1234", balance=2450000, currency="UZS"),
            Card(user_id=anvarjon.id, card_number_masked="9860********5566", balance=150, currency="USD"),
            Card(user_id=alibek.id, card_number_masked="9860********7890", balance=980000, currency="UZS"),
            Card(user_id=malika.id, card_number_masked="8600********9900", balance=12500000, currency="UZS"),
            Card(user_id=jasur.id, card_number_masked="5614********1122", balance=45000, currency="UZS"),
        ]
    )

    db.add_all(
        [
            # Anvarjon transactions
            Transaction(user_id=anvarjon.id, tx_date=datetime(2026, 3, 20, 10, 30), amount=125000, currency="UZS", merchant="Korzinka", tx_type="CARD_PAYMENT"),
            Transaction(user_id=anvarjon.id, tx_date=datetime(2026, 3, 25, 15, 45), amount=560000, currency="UZS", merchant="UzAuto Leasing", tx_type="TRANSFER"),
            Transaction(user_id=anvarjon.id, tx_date=datetime(2026, 4, 2, 9, 10), amount=87000, currency="UZS", merchant="Express24", tx_type="CARD_PAYMENT"),
            Transaction(user_id=anvarjon.id, tx_date=datetime(2026, 4, 5, 18, 20), amount=25000, currency="UZS", merchant="Payme: Kommunal", tx_type="PAYMENT"),
            Transaction(user_id=anvarjon.id, tx_date=datetime(2026, 4, 10, 12, 0), amount=150000, currency="UZS", merchant="Click: Beeline", tx_type="PAYMENT"),
            
            # Alibek transactions
            Transaction(user_id=alibek.id, tx_date=datetime(2026, 3, 28, 12, 0), amount=230000, currency="UZS", merchant="Makro", tx_type="CARD_PAYMENT"),
            Transaction(user_id=alibek.id, tx_date=datetime(2026, 4, 1, 20, 0), amount=45000, currency="UZS", merchant="Yandex Taxi", tx_type="CARD_PAYMENT"),
            
            # Malika transactions
            Transaction(user_id=malika.id, tx_date=datetime(2026, 4, 1, 10, 0), amount=2500000, currency="UZS", merchant="ZoodPay", tx_type="TRANSFER"),
            Transaction(user_id=malika.id, tx_date=datetime(2026, 4, 3, 14, 0), amount=120000, currency="UZS", merchant="Riviera Mall", tx_type="CARD_PAYMENT"),
            Transaction(user_id=malika.id, tx_date=datetime(2026, 4, 8, 11, 30), amount=450000, currency="UZS", merchant="Uzum Market", tx_type="CARD_PAYMENT"),
            
            # Jasur transactions
            Transaction(user_id=jasur.id, tx_date=datetime(2026, 3, 15, 9, 0), amount=15000, currency="UZS", merchant="Milliy Taomlar", tx_type="CARD_PAYMENT"),
            Transaction(user_id=jasur.id, tx_date=datetime(2026, 3, 20, 17, 0), amount=30000, currency="UZS", merchant="Aralash Store", tx_type="CARD_PAYMENT"),
        ]
    )

    db.add_all(
        [
            CreditHistory(user_id=anvarjon.id, report_date=datetime(2026, 4, 1, 8, 0), score=742, status="GOOD", note="Tolov intizomi ijobiy"),
            CreditHistory(user_id=alibek.id, report_date=datetime(2026, 4, 1, 8, 0), score=681, status="MEDIUM", note="Oxirgi oyda 1 marta kechikish kuzatilgan"),
            CreditHistory(user_id=malika.id, report_date=datetime(2026, 4, 1, 8, 0), score=820, status="EXCELLENT", note="Ideal kredit tarixi"),
            CreditHistory(user_id=jasur.id, report_date=datetime(2026, 4, 1, 8, 0), score=450, status="POOR", note="Bir nechta muddati o'tgan qarzdorlik mavjud"),
        ]
    )
    db.commit()


def _find_user(db: Session, user_name: str | None) -> User | None:
    if not user_name:
        return None
    lowered = user_name.strip().lower()
    query_parts = set(lowered.split())
    
    users = db.query(User).all()
    for user in users:
        db_name = user.full_name.lower()
        db_parts = set(db_name.split())
        
        if query_parts.issubset(db_parts) or db_parts.issubset(query_parts):
            return user
            
        if lowered in db_name or db_name in lowered:
            return user
            
    return None


def lookup_user_data(db: Session, query: dict) -> dict:
    request_type = (query.get("request_type") or "transactions").lower()
    user_name = query.get("user_name")
    user = _find_user(db, user_name)

    if not user:
        return {
            "found": False,
            "message": "Foydalanuvchi topilmadi",
            "query": query,
            "data": None,
        }

    if request_type == "card_balance":
        cards = db.query(Card).filter(Card.user_id == user.id).all()
        return {
            "found": True,
            "message": "Card balance malumotlari topildi",
            "query": query,
            "data": [
                {
                    "card_number_masked": card.card_number_masked,
                    "balance": card.balance,
                    "currency": card.currency,
                }
                for card in cards
            ],
        }

    if request_type == "credit_history":
        rows = db.query(CreditHistory).filter(CreditHistory.user_id == user.id).all()
        return {
            "found": True,
            "message": "Credit history topildi",
            "query": query,
            "data": [
                {
                    "report_date": row.report_date.isoformat(),
                    "score": row.score,
                    "status": row.status,
                    "note": row.note,
                }
                for row in rows
            ],
        }

    date_from = _parse_date(query.get("date_from"))
    date_to = _parse_date(query.get("date_to"), end_of_day=True)

    tx_query = db.query(Transaction).filter(Transaction.user_id == user.id)
    if date_from:
        tx_query = tx_query.filter(Transaction.tx_date >= date_from)
    if date_to:
        tx_query = tx_query.filter(Transaction.tx_date <= date_to)

    tx_rows = tx_query.order_by(Transaction.tx_date.asc()).all()
    return {
        "found": True,
        "message": "Transactions topildi",
        "query": query,
        "data": [
            {
                "tx_date": tx.tx_date.isoformat(),
                "amount": tx.amount,
                "currency": tx.currency,
                "merchant": tx.merchant,
                "tx_type": tx.tx_type,
            }
            for tx in tx_rows
        ],
    }


def _parse_date(raw: str | None, end_of_day: bool = False) -> datetime | None:
    if not raw:
        return None
    try:
        dt = datetime.fromisoformat(raw)
        if end_of_day:
            return dt.replace(hour=23, minute=59, second=59)
        return dt.replace(hour=0, minute=0, second=0)
    except ValueError:
        return None
