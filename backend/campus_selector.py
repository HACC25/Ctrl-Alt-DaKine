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

This file is self-contained and has no external dependencies beyond the standard library.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Sequence, Set, Tuple, Union
import csv
import json
import re
import difflib

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


def _campus_files(root: Path) -> List[Path]:
    """Find campus major files under UH-courses. Supports CSV and JSON.
    Filenames should contain "_majors" to be detected.

    NOTE FOR FUTURE FILES:
      Add new campus major lists under `UH-courses/` named like
      `manoa_majors.csv` or `kapcc_majors.json`. The loader will
      automatically pick them up once they follow the `_majors` pattern.
    """
    base = root / "UH-courses"
    if not base.exists():
        return []
    matches: List[Path] = []
    for p in base.glob("**/*_majors.*"):
        if p.suffix.lower() in {".csv", ".json"}:
            matches.append(p)
    return sorted(matches)


def _campus_name_from_file(path: Path) -> str:
    stem = path.stem  # e.g., "hilo_majors"
    name = stem.replace("_majors", "").replace("-majors", "").replace("_", " ")
    return name.strip().title()


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
            majors.add(normalize_major_name(raw))
    return majors


def _extract_majors_from_json(path: Path) -> Set[str]:
    majors: Set[str] = set()
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    # Support either list of strings, or list of dicts with a "name" field
    if isinstance(data, list):
        for item in data:
            if isinstance(item, str):
                majors.add(normalize_major_name(item))
            elif isinstance(item, dict):
                name = str(item.get("name", "")).strip()
                if name:
                    majors.add(normalize_major_name(name))
    elif isinstance(data, dict):
        # e.g., {"majors": [...]}
        seq = data.get("majors")
        if isinstance(seq, list):
            for item in seq:
                if isinstance(item, str):
                    majors.add(normalize_major_name(item))
                elif isinstance(item, dict):
                    name = str(item.get("name", "")).strip()
                    if name:
                        majors.add(normalize_major_name(name))
    return majors


def load_all_campus_catalogs() -> List[CampusMajors]:
    """Scan UH-courses for campus major files and return normalized catalogs.
    Safe if files are missing — returns an empty list.
    """
    root = _repo_root(Path(__file__))
    catalogs: List[CampusMajors] = []
    for file in _campus_files(root):
        if file.suffix.lower() == ".csv":
            majors = _extract_majors_from_csv(file)
        else:
            majors = _extract_majors_from_json(file)
        catalogs.append(CampusMajors(campus=_campus_name_from_file(file), majors=majors))
    return catalogs


# ------------- Selection logic -------------

def score_campus(majors_norm: Sequence[str], campus: CampusMajors) -> int:
    """Number of input majors present in this campus."""
    return sum(1 for m in majors_norm if m in campus.majors)


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
    return similarity >= 0.78


def select_best_campus(majors: Sequence[Union[str, Dict]], catalogs: Optional[List[CampusMajors]] = None) -> Dict:
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
        matches.append(CampusMatch(campus=campus.campus, matched=matched, missing=missing))

    if not matches:
        return {"selectedCampus": None, "matches": []}

    # Choose campus with max matched count, then fewer missing, then alphabetical campus
    matches_sorted = sorted(
        matches,
        key=lambda m: (-len(m.matched), len(m.missing), m.campus)
    )
    best = matches_sorted[0]

    return {
        "selectedCampus": best.campus if best.matched else None,
        "matches": [
            {"campus": m.campus, "matched": m.matched, "missing": m.missing}
            for m in matches_sorted
        ],
    }


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
