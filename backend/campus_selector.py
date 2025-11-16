"""
Utility to pick the best UH campus for a student's top majors.

- Input: a list of majors (strings) or objects like {"name": "Major", "why": "..."}.
- Data source: campus majors files under the repo's "UH-courses" folder.
  Expected patterns (to be added over time):
    - UH-courses/hilo_majors.csv
    - UH-courses/manoa_majors.csv
    - UH-courses/west_oahu_majors.csv
    - UH-courses/kcc_majors.csv
    - ...etc.
- Output: a simple result dict with the selected campus and match details.

This module now also brokers calls to Vertex AI, so it depends on `requests`.
"""
from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, Dict, Iterable, List, Optional, Sequence, Set, Tuple, Union
import csv
import os
import json
import re
import difflib
import requests

# ------------- Data structures -------------

@dataclass(frozen=True)
class CampusMajors:
    campus: str
    majors: Set[str]  # normalized names only


@dataclass
class CampusMatch:
    campus: str
    matched: List[str]  # input majors that matched this campus (original casing)
    missing: List[str]  # input majors that didn't match at this campus
    score: float = 0.0
    reasons: List[str] = field(default_factory=list)
    summary: str = ""


# ------------- AI-backed recommendation helpers -------------

_DEFAULT_MAJOR_SUGGESTIONS: List[Dict[str, str]] = [
    {"name": "Business Administration", "why": "Broad option with transferable skills"},
    {"name": "Computer Science", "why": "Strong tech industry demand"},
    {"name": "Hospitality Management", "why": "Signature UH program aligned with tourism"},
]


def _strip_code_fences(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        lines = [line for line in cleaned.splitlines() if not line.strip().startswith("```")]
        cleaned = "\n".join(lines).strip()
    cleaned = cleaned.replace("```json", "").replace("```", "").strip()
    return cleaned


def _coerce_json_dict(raw_text: str, *, label: str) -> Dict:
    cleaned = _strip_code_fences(raw_text)
    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError as err:
        print(f"[{label}] primary JSON parse failed: {err}")
        parsed = None
        if "{" in cleaned and "}" in cleaned:
            try:
                snippet = cleaned[cleaned.index("{") : cleaned.rindex("}") + 1]
                parsed = json.loads(snippet)
            except Exception as inner_err:
                print(f"[{label}] fallback JSON parse failed: {inner_err}")
    if isinstance(parsed, dict):
        return parsed
    if isinstance(parsed, list):
        return {"items": parsed}
    return {}


def _extract_majors_from_text(raw_text: str) -> List[Dict[str, str]]:
    """Best-effort extraction of majors from partially formatted text."""

    majors: List[Dict[str, str]] = []

    # Capture "name": "..." pairs even if trailing quote is missing
    name_pattern = re.compile(r'"name"\s*:\s*"([^"\n]+)')
    names = name_pattern.findall(raw_text)

    why_pattern = re.compile(r'"why"\s*:\s*"([^"\n]+)')
    whys = why_pattern.findall(raw_text)

    for idx, name in enumerate(names):
        reason = whys[idx] if idx < len(whys) else ""
        majors.append({"name": name.strip(), "why": reason.strip().rstrip(", ")})

    if majors:
        return [m for m in majors if m.get("name")]

    bullet_majors: List[Dict[str, str]] = []
    for line in raw_text.splitlines():
        stripped = line.strip().lstrip("-*•").strip()
        if not stripped:
            continue
        if ":" in stripped:
            name, reason = stripped.split(":", 1)
            bullet_majors.append({"name": name.strip(), "why": reason.strip()})
        else:
            bullet_majors.append({"name": stripped, "why": ""})

    return [m for m in bullet_majors if m.get("name")]


# ------------- Normalization helpers -------------

_punct_re = re.compile(r"[^a-z0-9]+")


def normalize_major_name(name: str) -> str:
    """Normalize a major string for consistent matching.
    - Lowercase
    - Collapse punctuation/whitespace to single dashes
    - Remove trailing degree suffixes in parentheses, e.g., 
      "Counseling Psychology, M.A." -> "counseling-psychology"
    """
    if not name:
        return ""
    s = name.strip().lower()
    # Remove common degree suffix patterns
    s = re.sub(r"\b(ba|b\.a\.|bs|b\.s\.|bfa|m\.a\.|ma|m\.s\.|ms|phd|ph\.d\.|dnp|d\.n\.p\.|mat|m\.a\.t\.)\b", "", s)
    s = re.sub(r"\([^)]*\)", "", s)  # remove parenthetical notes
    s = s.replace("&", "and")
    s = _punct_re.sub("-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s


def _normalize_text_to_tokens(text: str) -> Set[str]:
    if not text:
        return set()
    cleaned = text.lower().replace("-", " ")
    return set(filter(None, _punct_re.split(cleaned)))


def _normalize_values(values: Sequence[str]) -> Set[str]:
    if not values:
        return set()
    if isinstance(values, str):
        iterable = [values]
    else:
        iterable = list(values)
    tokens: Set[str] = set()
    for value in iterable:
        norm = normalize_major_name(value)
        if norm:
            tokens.add(norm)
    return tokens


MAJOR_CANONICAL_NAMES: Dict[str, Set[str]] = defaultdict(set)


def _record_major_name(raw: str) -> str:
    name = str(raw or "").strip()
    if not name:
        return ""
    norm = normalize_major_name(name)
    if norm:
        MAJOR_CANONICAL_NAMES[norm].add(name)
    return norm


def _pick_canonical_name(norm: str, *, fallback: str = "") -> str:
    options = MAJOR_CANONICAL_NAMES.get(norm)
    if not options:
        return fallback or norm.replace("-", " ").title()
    # Prefer longer descriptive names for clarity
    return sorted(options, key=lambda value: (-len(value), value))[0]


def _collect_word_tokens(norms: Iterable[str]) -> Set[str]:
    words: Set[str] = set()
    for norm in norms:
        for token in norm.split("-"):
            token = token.strip()
            if token:
                words.add(token)
    return words


def _join_tokens(tokens: Iterable[str], limit: int = 2) -> str:
    ordered = sorted(token.replace("-", " ") for token in tokens)
    if not ordered:
        return ""
    return " and ".join(ordered[:limit])


def _compose_brief_reason(
    interest_overlap: Set[str],
    skill_overlap: Set[str],
    why_overlap: Set[str],
) -> str:
    interest_str = _join_tokens(interest_overlap)
    skill_str = _join_tokens(skill_overlap)
    why_str = _join_tokens(why_overlap)

    if interest_str and skill_str:
        return f"Connects to your interest in {interest_str} and uses {skill_str} skills."
    if interest_str and why_str:
        return f"Connects to your interest in {interest_str} and fits UH focus on {why_str}."
    if interest_str:
        return f"Connects to your interest in {interest_str}."
    if skill_str:
        return f"Uses your {skill_str} skills."
    if why_str:
        return f"Fits UH focus on {why_str}."
    return "Supports your UH goals."


def _truncate_reason(text: str, limit: int = 22) -> str:
    words = text.split()
    if len(words) <= limit:
        return text
    truncated = " ".join(words[:limit]) + "..."
    return truncated


def _canonicalize_major_entries(entries: Sequence[Dict[str, str]]) -> List[Dict[str, str]]:
    canonicalized: List[Dict[str, str]] = []
    seen_norms: Set[str] = set()
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        raw_name = str(entry.get("name", "")).strip()
        if not raw_name:
            continue
        norm = normalize_major_name(raw_name)
        if not norm or norm in seen_norms:
            continue
        canonical_name = _pick_canonical_name(norm, fallback=raw_name)
        reason = _truncate_reason(str(entry.get("why", "")).strip())
        canonicalized.append({"name": canonical_name, "why": reason})
        seen_norms.add(norm)
    return canonicalized


def _augment_with_local_programs(
    majors: List[Dict[str, str]],
    desired: int,
    *,
    interest_norms: Set[str],
    skill_norms: Set[str],
    why_text: str,
) -> List[Dict[str, str]]:
    if len(majors) >= desired:
        return majors[:desired]

    if not MAJOR_CANONICAL_NAMES:
        load_all_campus_catalogs()

    existing_norms: Set[str] = {
        normalize_major_name(entry["name"]) for entry in majors if entry.get("name")
    }

    interest_words = _collect_word_tokens(interest_norms)
    skill_words = _collect_word_tokens(skill_norms)
    why_tokens = _normalize_text_to_tokens(why_text)

    scored_candidates: List[Tuple[float, str, str, str]] = []
    for norm, names in MAJOR_CANONICAL_NAMES.items():
        if not names or norm in existing_norms:
            continue
        major_words = _collect_word_tokens([norm])
        interest_overlap = major_words & interest_words
        skill_overlap = major_words & skill_words
        why_overlap = major_words & why_tokens
        base_score = 0.0
        if interest_overlap:
            base_score += 2.0 * len(interest_overlap)
        if skill_overlap:
            base_score += 1.2 * len(skill_overlap)
        if why_overlap:
            base_score += 0.8 * len(why_overlap)
        if base_score == 0:
            continue
        canonical_name = _pick_canonical_name(norm, fallback=sorted(names)[0])
        reason = _compose_brief_reason(interest_overlap, skill_overlap, why_overlap)
        scored_candidates.append((base_score, canonical_name, reason, norm))

    scored_candidates.sort(key=lambda item: (-item[0], item[1]))

    for _, name, reason, norm in scored_candidates:
        if len(majors) >= desired:
            break
        majors.append({"name": name, "why": reason})
        existing_norms.add(norm)

    if len(majors) < desired:
        for default in _DEFAULT_MAJOR_SUGGESTIONS:
            norm = normalize_major_name(default.get("name"))
            if not norm or norm in existing_norms:
                continue
            majors.append({"name": default["name"], "why": default.get("why", "")})
            existing_norms.add(norm)
            if len(majors) >= desired:
                break

    return majors[:desired]


_CAMPUS_PERSONAS_RAW = {
    "Manoa": {
        "summary": "Urban flagship campus in Honolulu with the broadest range of research and professional programs.",
        "base_weight": 1.25,
        "keywords": [
            "urban",
            "city",
            "honolulu",
            "big city",
            "diverse",
            "global",
            "research",
            "flagship",
            "vibrant",
        ],
        "focus": [
            "Business Administration",
            "International Business",
            "Computer Science",
            "Engineering",
            "Travel Industry Management",
            "Creative Media",
            "Environmental Science",
        ],
    },
    "Hilo": {
        "summary": "Friendly residential campus with strong ties to Hawaiian culture, astronomy, and the natural sciences.",
        "base_weight": 1.05,
        "keywords": [
            "nature",
            "island",
            "community",
            "close knit",
            "research",
            "volcano",
            "hawaiian culture",
            "outdoors",
        ],
        "focus": [
            "Marine Science",
            "Pharmacy",
            "Hawaiian Studies",
            "Astronomy",
            "Agriculture",
            "Psychology",
            "Education",
        ],
    },
    "West Oahu": {
        "summary": "Modern Kapolei campus focused on applied, career-oriented degrees and flexible pathways.",
        "base_weight": 1.05,
        "keywords": [
            "growing",
            "career",
            "modern",
            "family",
            "community",
            "west side",
            "kapolei",
        ],
        "focus": [
            "Cybersecurity",
            "Business Administration",
            "Public Administration",
            "Creative Media",
            "Sustainability",
            "Education",
        ],
    },
    "Kapiolani": {
        "summary": "Community college in Honolulu known for hospitality, culinary, and health sciences pathways.",
        "base_weight": 0.95,
        "keywords": [
            "hospitality",
            "culinary",
            "health",
            "urban",
            "transfer",
        ],
        "focus": [
            "Hospitality Management",
            "Culinary Arts",
            "Nursing",
            "Radiologic Technology",
            "Medical Laboratory Technician",
            "Entrepreneurship",
        ],
    },
    "Leeward": {
        "summary": "Accessible Pearl City campus with strong transfer pathways and support for first-generation students.",
        "base_weight": 0.9,
        "keywords": [
            "transfer",
            "support",
            "accessible",
            "community",
            "pearl city",
            "affordable",
        ],
        "focus": [
            "Teacher Education",
            "Business Technology",
            "Digital Media",
            "Culinary Arts",
            "STEM Foundations",
        ],
    },
    "Honolulu": {
        "summary": "Hands-on technical campus near downtown focused on trades, marine, and transportation careers.",
        "base_weight": 0.9,
        "keywords": [
            "hands on",
            "technical",
            "downtown",
            "marine",
            "aviation",
            "trade",
        ],
        "focus": [
            "Marine Technology",
            "Aviation Maintenance",
            "Automotive Technology",
            "Architecture",
            "Information Technology",
        ],
    },
    "Windward": {
        "summary": "Small Kaneohe campus with creative arts, Hawaiian studies, and environmental programs.",
        "base_weight": 0.9,
        "keywords": [
            "creative",
            "small",
            "kaneohe",
            "community",
            "outdoors",
            "supportive",
        ],
        "focus": [
            "Hawaiian Studies",
            "Theatre Arts",
            "Biological Sciences",
            "Veterinary Technology",
            "Music",
        ],
    },
    "Maui": {
        "summary": "Innovative island campus with applied science, sustainable tech, and creative media programs.",
        "base_weight": 1.0,
        "keywords": [
            "innovation",
            "island",
            "sustainable",
            "technology",
            "community",
        ],
        "focus": [
            "Applied Business",
            "Sustainable Science",
            "Engineering Technology",
            "Creative Media",
            "Hospitality",
        ],
    },
    "Hawaii Community College": {
        "summary": "Practical Hilo campus specializing in trades, construction, and community-focused careers.",
        "base_weight": 0.85,
        "keywords": [
            "hands on",
            "construction",
            "trades",
            "community",
            "hilo",
        ],
        "focus": [
            "Construction Management",
            "Culinary Arts",
            "Fire Science",
            "Automotive Technology",
            "Information Technology",
        ],
    },
    "Kauai": {
        "summary": "Close-knit campus emphasizing sustainability, hospitality, and island stewardship.",
        "base_weight": 0.85,
        "keywords": [
            "sustainability",
            "island",
            "community",
            "hospitality",
            "outdoors",
        ],
        "focus": [
            "Sustainability Science",
            "Hospitality",
            "Culinary Arts",
            "Business Technology",
            "Natural Resource Management",
        ],
    },
}


def _prepare_personas(raw: Dict[str, Dict[str, Sequence[str]]]) -> Dict[str, Dict[str, object]]:
    personas: Dict[str, Dict[str, object]] = {}
    for campus_label, data in raw.items():
        key = normalize_major_name(campus_label)
        keywords = [kw.lower() for kw in data.get("keywords", []) if kw]
        focus_pairs: List[Tuple[str, str]] = []
        for focus in data.get("focus", []) or []:
            norm_focus = _record_major_name(focus)
            if norm_focus:
                focus_pairs.append((norm_focus, focus))
        personas[key] = {
            "summary": data.get("summary", ""),
            "keywords": keywords,
            "focus_pairs": focus_pairs,
            "base_weight": float(data.get("base_weight", 1.0)),
        }
    return personas


CAMPUS_PERSONAS = _prepare_personas(_CAMPUS_PERSONAS_RAW)


_CAMPUS_EXTRA_PROGRAMS_RAW = {
    "Manoa": [
        "Business Administration",
        "International Business",
        "Finance",
        "Marketing",
        "Civil Engineering",
        "Mechanical Engineering",
        "Electrical Engineering",
        "Marine Biology",
        "Data Science",
        "Global Environmental Science",
        "Hawaiian Studies",
    ],
    "Hilo": [
        "Marine Science",
        "Pharmacy",
        "Astronomy",
        "Agriculture",
        "Hawaiian Studies",
        "Tropical Conservation Biology",
    ],
    "West Oahu": [
        "Cybersecurity",
        "Public Administration",
        "Creative Media",
        "Business Administration",
        "Education",
        "Supply Chain Management",
    ],
    "Kapiolani": [
        "Hospitality Management",
        "Culinary Arts",
        "Radiologic Technology",
        "Medical Laboratory Technician",
        "Nursing",
        "Entrepreneurship",
    ],
    "Leeward": [
        "Teacher Education",
        "Culinary Arts",
        "Digital Media",
        "Information Technology",
        "Business Technology",
    ],
    "Honolulu": [
        "Marine Technology",
        "Aviation Maintenance",
        "Automotive Technology",
        "Architecture",
        "Welding",
        "Information Technology",
    ],
    "Windward": [
        "Hawaiian Studies",
        "Creative Media",
        "Veterinary Technology",
        "Music",
        "Marine Option Program",
    ],
    "Maui": [
        "Applied Business and Information Technology",
        "Sustainable Science Management",
        "Engineering Technology",
        "Hospitality",
        "Creative Media",
    ],
    "Hawaii Community College": [
        "Construction Management",
        "Culinary Arts",
        "Fire Science",
        "Automotive Technology",
        "Diesel Mechanics",
    ],
    "Kauai": [
        "Hospitality",
        "Culinary Arts",
        "Natural Science",
        "Sustainability",
        "Early Childhood Education",
    ],
}


def _prepare_extra_programs(raw: Dict[str, Sequence[str]]) -> Dict[str, Set[str]]:
    mapping: Dict[str, Set[str]] = {}
    for campus_label, programs in raw.items():
        key = normalize_major_name(campus_label)
        entries: Set[str] = set()
        for program in programs:
            norm = _record_major_name(program)
            if norm:
                entries.add(norm)
        if entries:
            mapping[key] = entries
    return mapping


CAMPUS_EXTRA_PROGRAMS = _prepare_extra_programs(_CAMPUS_EXTRA_PROGRAMS_RAW)


def _evaluate_persona_fit(
    campus_name: str,
    why_text: str,
    interest_tokens: Set[str],
    skill_tokens: Set[str],
) -> Tuple[float, List[str], str, float]:
    persona = CAMPUS_PERSONAS.get(normalize_major_name(campus_name))
    if not persona:
        return 0.0, [], "", 1.0

    reasons: List[str] = []
    score = 0.0
    summary = persona.get("summary", "")
    base_weight = float(persona.get("base_weight", 1.0))

    lower_why = (why_text or "").lower().replace("-", " ")
    
    # LOCATION PREFERENCE: Detect if student mentions specific island/location
    # If they mention a location, HEAVILY boost that campus
    location_keywords = {
        "manoa": ["manoa", "honolulu", "oahu", "o'ahu"],
        "hilo": ["hilo", "big island", "hawaii island"],
        "west-oahu": ["west oahu", "west o'ahu", "kapolei", "ewa"],
        "honolulu": ["honolulu community"],
        "kapiolani": ["kapiolani", "kcc", "diamond head"],
        "leeward": ["leeward", "pearl city", "waianae"],
        "windward": ["windward", "kaneohe", "koolau"],
        "maui": ["maui"],
        "kauai": ["kauai", "kaua'i", "garden isle"],
        "hawaii-community-college": ["hcc", "hawaii cc"],
    }
    
    campus_norm = normalize_major_name(campus_name)
    if campus_norm in location_keywords:
        for location_term in location_keywords[campus_norm]:
            if location_term in lower_why:
                # Student explicitly wants this location - HUGE boost!
                score += 15.0
                reasons.insert(0, f"You mentioned wanting to study in {campus_name}.")
                break
    
    # Also check for phrases like "stay in", "live in", "near", "close to"
    location_phrases = ["stay in", "live in", "near", "close to", "want to be in", "prefer"]
    for phrase in location_phrases:
        if phrase in lower_why and campus_norm in location_keywords:
            for location_term in location_keywords[campus_norm]:
                # Check if location term appears after the phrase
                phrase_idx = lower_why.find(phrase)
                if phrase_idx >= 0 and location_term in lower_why[phrase_idx:]:
                    score += 15.0
                    reasons.insert(0, f"Perfect fit - you want to {phrase} {campus_name}.")
                    break

    keyword_hits: List[str] = []
    for keyword in persona.get("keywords", []):
        if keyword and keyword in lower_why:
            keyword_hits.append(keyword)
    if keyword_hits:
        unique_hits = sorted(set(keyword_hits))
        score += 1.2 * len(unique_hits)
        reasons.append(f"Campus vibe matches your interest in {', '.join(unique_hits[:3])}.")

    focus_hits: List[str] = []
    for norm_focus, display in persona.get("focus_pairs", []):
        if norm_focus and (norm_focus in interest_tokens or norm_focus in skill_tokens):
            focus_hits.append(display)
    if focus_hits:
        unique_focus = sorted(set(focus_hits))
        score += 0.9 * len(unique_focus)
        reasons.append(f"Strong programs in {', '.join(unique_focus[:3])} align with your goals.")

    return score, reasons, summary, base_weight


def _coerce_major_names(majors: Sequence[Union[str, Dict]]) -> Tuple[List[str], List[str]]:
    """Return (original_names, normalized_names) from input majors which can
    be strings or dicts like {"name": "Computer Science", ...}.
    """
    originals: List[str] = []
    norms: List[str] = []
    for m in majors:
        if isinstance(m, dict):
            val = str(m.get("name", "")).strip()
        else:
            val = str(m).strip()
        if not val:
            continue
        originals.append(val)
        norms.append(normalize_major_name(val))
    return originals, norms


# ------------- Campus catalog loading -------------

def _repo_root(file: Path) -> Path:
    # backend/<this file> -> repo root is parent of backend
    return file.resolve().parents[1]


_CAMPUS_NAME_OVERRIDES = {
    "Manoa": "Manoa",
    "Hilo": "Hilo",
    "West Oahu": "West Oahu",
    "Hawaiicc": "Hawaii Community College",
    "Honolulucc": "Honolulu",
    "Kapiolani": "Kapiolani",
    "Leeward": "Leeward",
    "Windward": "Windward",
    "Maui": "Maui",
    "Kauai": "Kauai",
    "Pcatt": "PCATT",
}


def _campus_name_from_file(path: Path) -> str:
    stem = path.stem  # e.g., "hilo_majors"
    name = stem
    for marker in ("_majors", "-majors", "_courses", "-courses", "_degree_pathways", "-degree-pathways"):
        name = name.replace(marker, "")
    name = name.replace("_", " ")
    display = name.strip().title()
    return _CAMPUS_NAME_OVERRIDES.get(display, display)


def _extract_majors_from_csv(path: Path) -> Set[str]:
    majors: Set[str] = set()
    with path.open("r", encoding="utf-8") as f:
        reader = csv.reader(f)
        rows = list(reader)
        if not rows:
            return majors
        # Try to detect header
        header = [c.strip().lower() for c in rows[0]]
        data_rows = rows[1:] if header else rows
        # Heuristics: prefer a column containing "major" in its header; else use column 1
        col_idx = None
        for i, col in enumerate(header):
            if "major" in col or "program" in col or "degree" in col:
                col_idx = i
                break
        if col_idx is None:
            # Fallback to second column if present, else first
            col_idx = 1 if data_rows and len(data_rows[0]) > 1 else 0
        for r in data_rows:
            if not r:
                continue
            try:
                raw = r[col_idx].strip()
            except IndexError:
                continue
            if not raw:
                continue
            norm = _record_major_name(raw)
            if norm:
                majors.add(norm)
    return majors


def _extract_majors_from_json(path: Path) -> Set[str]:
    majors: Set[str] = set()
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    # Support either list of strings, or list of dicts with a "name" field
    if isinstance(data, list):
        for item in data:
            if isinstance(item, str):
                norm = _record_major_name(item)
                if norm:
                    majors.add(norm)
            elif isinstance(item, dict):
                name = str(item.get("name", "")).strip()
                if name:
                    norm = _record_major_name(name)
                    if norm:
                        majors.add(norm)
    elif isinstance(data, dict):
        # e.g., {"majors": [...]}
        seq = data.get("majors")
        if isinstance(seq, list):
            for item in seq:
                if isinstance(item, str):
                    norm = _record_major_name(item)
                    if norm:
                        majors.add(norm)
                elif isinstance(item, dict):
                    name = str(item.get("name", "")).strip()
                    if name:
                        norm = _record_major_name(name)
                        if norm:
                            majors.add(norm)
    return majors


def _extract_programs_from_courses_csv(path: Path) -> Set[str]:
    """Derive program areas from campus course catalogs via department names."""

    majors: Set[str] = set()
    with path.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if not row:
                continue
            dept = (row.get("dept_name") or row.get("department") or "").strip()
            if dept:
                norm = _record_major_name(dept)
                if norm:
                    majors.add(norm)
    return majors


def _extract_programs_from_degree_json(path: Path) -> Set[str]:
    """Derive program names from structured degree pathway JSON files."""

    majors: Set[str] = set()
    with path.open("r", encoding="utf-8") as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError:
            return majors

    if isinstance(data, list):
        for entry in data:
            if isinstance(entry, dict):
                program = str(entry.get("program_name", "")).strip()
                if program:
                    norm = _record_major_name(program)
                    if norm:
                        majors.add(norm)
    elif isinstance(data, dict):
        programs = data.get("programs") or data.get("majors")
        if isinstance(programs, list):
            for item in programs:
                if isinstance(item, dict):
                    program = str(item.get("program_name", "")).strip()
                else:
                    program = str(item).strip()
                if program:
                    norm = _record_major_name(program)
                    if norm:
                        majors.add(norm)
    return majors


def load_all_campus_catalogs() -> List[CampusMajors]:
    """Scan UH-courses for campus major files and return normalized catalogs.
    Safe if files are missing — returns an empty list.
    """
    root = _repo_root(Path(__file__))
    base = root / "UH-courses"
    if not base.exists():
        return []

    campus_programs: Dict[str, Dict[str, object]] = {}

    def _ensure_entry(display_name: str) -> Dict[str, object]:
        campus_key = normalize_major_name(display_name)
        entry = campus_programs.setdefault(
            campus_key,
            {"name": display_name, "majors": set()},
        )
        if display_name and entry["name"] != display_name and len(display_name) > len(entry["name"]):
            entry["name"] = display_name
        return entry

    for file in base.glob("**/*_majors.csv"):
        entry = _ensure_entry(_campus_name_from_file(file))
        entry["majors"].update(_extract_majors_from_csv(file))

    for file in base.glob("**/*_majors.json"):
        entry = _ensure_entry(_campus_name_from_file(file))
        entry["majors"].update(_extract_majors_from_json(file))

    for file in base.glob("**/*_courses.csv"):
        programs = _extract_programs_from_courses_csv(file)
        if programs:
            entry = _ensure_entry(_campus_name_from_file(file))
            entry["majors"].update(programs)

    for file in base.glob("**/*_degree_pathways.json"):
        programs = _extract_programs_from_degree_json(file)
        if programs:
            entry = _ensure_entry(_campus_name_from_file(file))
            entry["majors"].update(programs)

    for campus_key, extras in CAMPUS_EXTRA_PROGRAMS.items():
        entry = campus_programs.setdefault(
            campus_key,
            {
                "name": campus_key.replace("-", " ").title(),
                "majors": set(),
            },
        )
        entry["majors"].update(extras)

    catalogs: List[CampusMajors] = []
    for payload in campus_programs.values():
        majors = payload.get("majors", set())
        if majors:
            catalogs.append(CampusMajors(campus=payload.get("name", ""), majors=majors))

    return sorted(catalogs, key=lambda c: c.campus)

def _is_close_match(norm: str, campus_major: str) -> bool:
    """Heuristic match allowing minor name differences.

    Handles cases where a campus file abbreviates or expands a title.
    """
    if not norm or not campus_major:
        return False
    if norm == campus_major:
        return True
    if norm in campus_major or campus_major in norm:
        return True

    norm_tokens = set(filter(None, norm.split("-")))
    campus_tokens = set(filter(None, campus_major.split("-")))
    if norm_tokens and norm_tokens.issubset(campus_tokens):
        return True
    if campus_tokens and campus_tokens.issubset(norm_tokens):
        return True

    similarity = difflib.SequenceMatcher(None, norm, campus_major).ratio()
    return similarity >= 0.82


def select_best_campus(
    majors: Sequence[Union[str, Dict]],
    catalogs: Optional[List[CampusMajors]] = None,
    *,
    why_uh: str = "",
    interests: Optional[Sequence[str]] = None,
    skills: Optional[Sequence[str]] = None,
) -> Dict:
    """Pick the campus that covers the most of the given majors.

    Returns dict:
    {
      "selectedCampus": "Hilo",
      "matches": [
         {"campus": "Hilo", "matched": ["Computer Science"], "missing": ["Business", "Hospitality"]},
         {"campus": "Manoa", ...}
      ]
    }

    If multiple campuses tie, choose the one with the most total majors matched; if still tied,
    choose the alphabetically first campus name.
    """
    originals, norms = _coerce_major_names(majors)
    catalogs = catalogs if catalogs is not None else load_all_campus_catalogs()
    interest_tokens = _normalize_values(interests or [])
    skill_tokens = _normalize_values(skills or [])

    matches: List[CampusMatch] = []
    for campus in catalogs:
        matched: List[str] = []
        missing: List[str] = []
        for original, norm in zip(originals, norms):
            if norm in campus.majors:
                matched.append(original)
                continue

            # Try a fuzzy match against campus majors to handle slightly different naming.
            if any(_is_close_match(norm, campus_major) for campus_major in campus.majors):
                matched.append(original)
            else:
                missing.append(original)
        persona_score, persona_reasons, persona_summary, persona_weight = _evaluate_persona_fit(
            campus.campus, why_uh, interest_tokens, skill_tokens
        )
        reason_list: List[str] = []
        if matched:
            reason_list.append(f"Offers programs matching your interests: {', '.join(matched[:3])}.")
        reason_list.extend(persona_reasons)
        major_score = float(len(matched)) * 3.0
        penalty = float(len(missing)) * 0.4
        raw_major_strength = max(major_score - penalty, 0.0)
        weighted_major = raw_major_strength * max(persona_weight, 0.6)
        total_score = weighted_major + persona_score
        if persona_score == 0 and why_uh and why_uh.strip():
            total_score -= 2.5

        matches.append(
            CampusMatch(
                campus=campus.campus,
                matched=matched,
                missing=missing,
                score=total_score,
                reasons=reason_list,
                summary=persona_summary,
            )
        )

    if not matches:
        return {"selectedCampus": None, "matches": []}

    # Choose campus with max matched count, then fewer missing, then alphabetical campus
    matches_sorted = sorted(
        matches,
        key=lambda m: (-m.score, -len(m.matched), len(m.missing), m.campus)
    )
    best = matches_sorted[0]

    return {
        "selectedCampus": best.campus,
        "matches": [
            {
                "campus": m.campus,
                "matched": m.matched,
                "missing": m.missing,
                "score": round(m.score, 2),
                "reasons": m.reasons,
                "summary": m.summary,
            }
            for m in matches_sorted
        ],
    }


def recommend_majors_via_ai(
    *,
    why_uh: str,
    interests: Sequence[str],
    skills: Sequence[str],
    top_n: int,
    token_fetcher: Optional[Callable[[], str]] = None,
) -> Dict[str, Union[List[Dict[str, str]], str]]:
    """Call Vertex AI (if available) to suggest majors."""

    desired = max(1, min(top_n or 3, 5))
    fallback = {"majors": _DEFAULT_MAJOR_SUGGESTIONS[:desired]}
    partial_warning = False
    interest_norms = _normalize_values(interests)
    skill_norms = _normalize_values(skills)

    if not MAJOR_CANONICAL_NAMES:
        try:
            load_all_campus_catalogs()
        except Exception as preload_err:  # noqa: BLE001
            print("Warning: unable to preload campus catalogs:", preload_err)

    if not token_fetcher:
        fallback["warning"] = "Service account not configured; returning default suggestions."
        return fallback

    # Truncate user inputs to avoid sending huge text blocks that consume input tokens
    why_uh_truncated = (why_uh or "").strip()[:500]  # max 500 chars
    interests_truncated = list(interests or [])[:10]  # max 10 items
    skills_truncated = list(skills or [])[:10]  # max 10 items
    
    summary_bits = [
        f"Reason for UH: {why_uh_truncated or 'Not provided'}",
        f"Interests: {', '.join(interests_truncated) if interests_truncated else 'None'}",
        f"Skills: {', '.join(skills_truncated) if skills_truncated else 'None'}",
    ]

    # Use an ultra-compact prompt to minimize input token usage
    prompt = (
        f"UH advisor: recommend {desired} majors (JSON only).\n"
        f"{os.linesep.join(summary_bits)}\n"
        "Format: {{\"majors\":[{{\"name\":\"Major\",\"why\":\"<8 words\"}}]}}\n"
        "No extra text."
    )
    
    # Log prompt length for debugging
    print(f"[DEBUG] Prompt length: {len(prompt)} chars, ~{len(prompt.split())} words")

    try:
        token = token_fetcher()
        project_id = os.environ.get("VERTEX_PROJECT_ID", "sigma-night-477219-g4")
        location = os.environ.get("VERTEX_LOCATION", "us-central1")
        model_id = os.environ.get("VERTEX_MAJOR_MODEL", "gemini-2.5-pro")

        url = (
            f"https://{location}-aiplatform.googleapis.com/v1/projects/{project_id}/locations/"
            f"{location}/publishers/google/models/{model_id}:generateContent"
        )

        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        payload = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            # compact output: enough tokens for 3-5 short majors but not excessive
            "generation_config": {
                "temperature": 0.0,
                "maxOutputTokens": 1024,  # increased - 512 was too low for even minimal JSON
                "topP": 1.0,
                "topK": 1,
            },
        }

        response = requests.post(url, headers=headers, json=payload, timeout=30)
        if not response.ok:
            print("Vertex major request failed", response.status_code, response.text)
            response.raise_for_status()

        data = response.json()
        candidate = data.get("candidates", [{}])[0]
        finish_reason = candidate.get("finishReason", "UNKNOWN")
        raw_text = candidate.get("content", {}).get("parts", [{}])[0].get("text", "")

        print("=== MAJOR RAW AI RESPONSE ===")
        print(f"Finish Reason: {finish_reason}")
        print(raw_text)
        print("================================")

        lowered = raw_text.lower()
        refusal_keywords = ["cannot fulfill", "cannot generate", "safety", "inappropriate", "violates"]
        if any(keyword in lowered for keyword in refusal_keywords):
            fallback["warning"] = "AI refused the request; returning default suggestions."
            return fallback

        parsed = _coerce_json_dict(raw_text, label="major-recommendations")
        majors_payload = parsed.get("majors") if isinstance(parsed, dict) else None
        if not isinstance(majors_payload, list):
            majors_payload = parsed.get("items") if isinstance(parsed, dict) else None

        cleaned_list: List[Dict[str, str]] = []
        if isinstance(majors_payload, list):
            for entry in majors_payload:
                if isinstance(entry, dict):
                    name = str(entry.get("name", "")).strip()
                    reason = str(entry.get("why", "")).strip()
                else:
                    name = str(entry).strip()
                    reason = ""
                if not name:
                    continue
                cleaned_list.append({"name": name, "why": reason})
                if len(cleaned_list) >= desired:
                    break

        if not cleaned_list:
            # If the primary JSON parse didn't yield usable results, try to recover
            # names from the raw text. If the response was truncated (MAX_TOKENS),
            # attempt a compact retry prompt asking the model to return a minimal
            # JSON payload (short reasons) to avoid hitting token limits.
            recovered = _extract_majors_from_text(raw_text)
            if recovered:
                cleaned_list = recovered[:desired]
                partial_warning = True
            elif finish_reason == "MAX_TOKENS":
                # Retry with a compact prompt to force shorter output
                retry_prompt = (
                    "You were cut off. Reply with ONLY compact JSON in this exact shape:"
                    " {\"majors\":[{\"name\":\"Major Name\",\"why\":\"Short reason (<=10 words)\"}]}"
                    " Do not include any extra text or formatting. Limit each 'why' to 10 words."
                )
                try:
                    payload_retry = {
                        "contents": [{"role": "user", "parts": [{"text": retry_prompt}]}],
                        "generation_config": {"temperature": 0.0, "maxOutputTokens": 512},
                    }
                    resp2 = requests.post(url, headers=headers, json=payload_retry, timeout=20)
                    if resp2.ok:
                        data2 = resp2.json()
                        candidate2 = data2.get("candidates", [{}])[0]
                        raw2 = candidate2.get("content", {}).get("parts", [{}])[0].get("text", "")
                        parsed2 = _coerce_json_dict(raw2, label="major-recommendations-retry")
                        majors_payload2 = parsed2.get("majors") if isinstance(parsed2, dict) else None
                        if isinstance(majors_payload2, list):
                            cleaned_list = []
                            for entry in majors_payload2:
                                if isinstance(entry, dict):
                                    name = str(entry.get("name", "")).strip()
                                    reason = str(entry.get("why", "")).strip()
                                else:
                                    name = str(entry).strip()
                                    reason = ""
                                if not name:
                                    continue
                                cleaned_list.append({"name": name, "why": reason})
                                if len(cleaned_list) >= desired:
                                    break
                            if cleaned_list:
                                partial_warning = True
                    # else: fall back to recovered/defaults below
                except Exception:
                    # network/parse error on retry -> will fall back to defaults
                    pass
            else:
                raise ValueError("No usable majors returned")

        cleaned_list = _canonicalize_major_entries(cleaned_list)
        before_local = len(cleaned_list)
        cleaned_list = _augment_with_local_programs(
            cleaned_list,
            desired,
            interest_norms=interest_norms,
            skill_norms=skill_norms,
            why_text=why_uh,
        )
        if len(cleaned_list) > before_local:
            partial_warning = True

        result: Dict[str, Union[List[Dict[str, str]], str]] = {"majors": cleaned_list[:desired]}
        warnings: List[str] = []
        if finish_reason == "MAX_TOKENS":
            warnings.append("AI response was truncated; results may be incomplete.")
        if partial_warning:
            warnings.append("Recovered majors from partial AI response.")
        if warnings:
            result["warning"] = " ".join(warnings)
        return result

    except requests.HTTPError as http_err:  # noqa: BLE001
        detail = getattr(http_err.response, "text", "") if hasattr(http_err, "response") else ""
        snippet = detail.strip().replace("\n", " ")[:240]
        print("Vertex AI HTTP error while generating majors:", snippet or http_err)
        fallback.setdefault(
            "warning",
            "Fell back to default majors due to a Vertex AI error." + (f" Details: {snippet}" if snippet else ""),
        )
        return fallback
    except Exception as err:  # noqa: BLE001
        print("Error generating majors:", err)
        fallback.setdefault("warning", "Fell back to defaults due to an AI error.")
        return fallback


def generate_map_insights(
    *,
    why_uh: str,
    interests: Sequence[str],
    skills: Sequence[str],
    top_n: int,
    token_fetcher: Optional[Callable[[], str]] = None,
) -> Dict[str, Union[str, List[Dict[str, Union[str, List[str]]]]]]:
    """Produce majors plus campus matches for the frontend map."""

    desired = max(1, min(top_n or 3, 5))
    majors_result = recommend_majors_via_ai(
        why_uh=why_uh,
        interests=interests,
        skills=skills,
        top_n=desired,
        token_fetcher=token_fetcher,
    )

    majors = []
    if isinstance(majors_result, dict):
        majors = list(majors_result.get("majors", []))
    majors = majors[:desired]

    warnings: List[str] = []
    warning_text = majors_result.get("warning") if isinstance(majors_result, dict) else None
    if warning_text:
        warnings.append(str(warning_text))

    if not majors:
        majors = _DEFAULT_MAJOR_SUGGESTIONS[:desired]
        warnings.append("Unable to generate majors; using defaults.")

    catalogs = load_all_campus_catalogs()
    campus_selection = select_best_campus(
        majors,
        catalogs=catalogs,
        why_uh=why_uh,
        interests=interests,
        skills=skills,
    )
    campus_matches = campus_selection.get("matches", []) if isinstance(campus_selection, dict) else []

    response: Dict[str, Union[str, List[Dict[str, Union[str, List[str]]]]]] = {
        "majors": majors,
        "campuses": campus_matches[:desired],
        "allCampuses": campus_matches,
        "selectedCampus": campus_selection.get("selectedCampus") if isinstance(campus_selection, dict) else None,
    }

    if not catalogs:
        warnings.append("UH campus catalogs are missing; campus matches may be incomplete.")
    if warnings:
        response["warning"] = " ".join(warnings)

    return response


# ------------- Persistence (optional) -------------

def save_selection(selection: Dict, filename: str = "selected_campus.json") -> Path:
    """Save selection result under backend/<filename> for later use.
    Returns the file path written.
    """
    backend_dir = Path(__file__).resolve().parent
    out = backend_dir / filename
    out.write_text(json.dumps(selection, indent=2, ensure_ascii=False), encoding="utf-8")
    return out


# ------------- Example usage (commented TEST CODE) -------------
if __name__ == "__main__":
    # TEST CODE: quick manual check (won't run unless you execute this file directly)
    sample_majors = [
        {"name": "Business Administration"},
        {"name": "Computer Science"},
        {"name": "Hospitality Management"},
    ]
    result = select_best_campus(sample_majors)
    print(json.dumps(result, indent=2))
    save_path = save_selection(result)
    print(f"Saved selection to: {save_path}")
