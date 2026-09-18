import re
import unicodedata
from typing import Type
from sqlalchemy.orm import Session

# Transliteration mapping for Cyrillic and Uzbek special characters
TRANSLIT_MAP = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'j', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'x', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sh',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'ў': 'o', 'ғ': 'g', 'қ': 'q', 'ҳ': 'h',
    'oʻ': 'o', 'o‘': 'o', "o'": 'o', 'o`': 'o',
    'gʻ': 'g', 'g‘': 'g', "g'": 'g', 'g`': 'g',
}

def slugify(text: str, max_length: int = 200) -> str:
    """
    Generates a clean, URL-safe, lowercase, hyphen-separated slug from any text.
    Handles Uzbek/Russian Cyrillic, special apostrophes, punctuation, and multiple dashes.
    """
    if not text:
        return "item"

    text = str(text).strip().lower()

    # Transliterate known characters
    output = []
    i = 0
    while i < len(text):
        matched = False
        # Check 2-char combos (e.g. o', g')
        if i + 1 < len(text):
            two_chars = text[i:i+2]
            if two_chars in TRANSLIT_MAP:
                output.append(TRANSLIT_MAP[two_chars])
                i += 2
                matched = True
        if not matched:
            char = text[i]
            output.append(TRANSLIT_MAP.get(char, char))
            i += 1

    translit_text = "".join(output)

    # Normalize unicode
    normalized = unicodedata.normalize('NFKD', translit_text)
    ascii_text = normalized.encode('ascii', 'ignore').decode('ascii')

    # Replace percentage with meaningful text or drop cleanly
    ascii_text = ascii_text.replace('%', '')

    # Replace any non-alphanumeric character with hyphen
    slug = re.sub(r'[^a-z0-9]+', '-', ascii_text)

    # Collapse multiple consecutive hyphens
    slug = re.sub(r'-+', '-', slug)

    # Strip leading and trailing hyphens
    slug = slug.strip('-')

    if not slug:
        slug = "item"

    # Truncate to max_length without cutting mid-word if possible
    if len(slug) > max_length:
        slug = slug[:max_length].rstrip('-')

    return slug


def generate_unique_slug(db: Session, model_class: Type, name: str, current_id: str = None) -> str:
    """
    Generates a unique slug for a given SQLAlchemy model (Product, Category, Seller, Brand).
    If a collision occurs, appends -2, -3, etc.
    """
    base_slug = slugify(name)
    slug = base_slug
    counter = 1

    while True:
        query = db.query(model_class).filter(model_class.slug == slug)
        if current_id:
            query = query.filter(model_class.id != current_id)
        existing = query.first()
        if not existing:
            return slug
        counter += 1
        slug = f"{base_slug}-{counter}"
