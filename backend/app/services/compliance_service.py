from app.models import ComplianceRule


def local_rule_check(raw_text: str, rules: list[ComplianceRule]) -> tuple[bool, str, str]:
    lowered = raw_text.lower()
    for rule in rules:
        if rule.prohibited_pattern.lower() in lowered:
            return False, f"Taqiqlangan pattern topildi: {rule.prohibited_pattern}", rule.legal_basis
    return True, "Local rule check bo'yicha zidlik topilmadi", "N/A"
