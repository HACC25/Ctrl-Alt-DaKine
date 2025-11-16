"""
Campus rundown tool

Usage:
    python campus_rundown.py --campus Manoa

What it does:
- Loads campus personas from `backend/campus_selector.py` (summary, keywords, focus programs)
- Looks for a UH-Reveal-Pages HTML file matching the campus and prints a link if found
- Scans `UH-courses/json_format/*.json` (if present) for course titles/descriptions matching top focus programs
- Prints a short human-readable rundown for the selected campus
"""

import argparse
import os
import json
import difflib
from pathlib import Path
from typing import List

# Import campus personas and helper functions from campus_selector
import campus_selector

ROOT = Path(__file__).resolve().parents[1]
UH_COURSES_JSON_DIR = ROOT / "UH-courses" / "json_format"
UH_REVEAL_DIR = ROOT / "UH-Reveal-Pages"


def normalize_campus_input(name: str) -> str:
    return campus_selector.normalize_major_name(name)


def find_best_campus_key(query: str) -> str:
    """Return the best matching campus key from CAMPUS_PERSONAS or raise ValueError."""
    key = normalize_campus_input(query)
    if key in campus_selector.CAMPUS_PERSONAS:
        return key

    # Try matching against display names (title-case)
    candidates = []
    for k in campus_selector.CAMPUS_PERSONAS.keys():
        display = k.replace("-", " ").title()
        candidates.append(display)

    close = difflib.get_close_matches(query, candidates, n=1, cutoff=0.6)
    if close:
        # convert display back to normalized key
        chosen_display = close[0]
        return normalize_campus_input(chosen_display)

    # As a last resort try fuzzy match against raw keys
    raw_keys = [k for k in campus_selector.CAMPUS_PERSONAS.keys()]
    close2 = difflib.get_close_matches(key, raw_keys, n=1, cutoff=0.5)
    if close2:
        return close2[0]

    raise ValueError(f"No campus found matching '{query}'")


def find_reveal_page(campus_query: str) -> str:
    """Return path to local reveal page (if any) matching campus_query, else empty string."""
    if not UH_REVEAL_DIR.exists():
        return ""
    files = list(UH_REVEAL_DIR.glob("*.html"))
    target = campus_query.lower().replace(" ", "")
    for f in files:
        name = f.stem.lower()
        if target in name:
            return str(f)
    # try fuzzy
    names = [f.stem for f in files]
    close = difflib.get_close_matches(campus_query, names, n=1, cutoff=0.5)
    if close:
        return str(UH_REVEAL_DIR / (close[0] + ".html"))
    return ""


def load_course_catalogs() -> List[dict]:
    """Load all JSON course catalogs under UH-courses/json_format (if present).
    Returns a list of course dicts.
    """
    courses = []
    if not UH_COURSES_JSON_DIR.exists():
        return courses
    for p in UH_COURSES_JSON_DIR.glob("*.json"):
        try:
            with p.open("r", encoding="utf-8") as fh:
                data = json.load(fh)
                # If file is a list of courses, extend
                if isinstance(data, list):
                    courses.extend(data)
                elif isinstance(data, dict):
                    # maybe contains top-level mapping -> try to find course-like lists
                    # common key names: courses, items
                    for key in ("courses", "items", "data"):
                        if key in data and isinstance(data[key], list):
                            courses.extend(data[key])
                            break
        except Exception:
            # skip files we can't parse
            continue
    return courses


def find_courses_for_focus(courses: List[dict], focus_terms: List[str], limit: int = 3) -> List[dict]:
    matches = []
    focus_tokens = [t.lower() for t in focus_terms if t]
    for c in courses:
        title = str(c.get("course_title") or "").lower()
        desc = str(c.get("course_desc") or "").lower()
        hay = title + "\n" + desc
        score = 0
        for tok in focus_tokens:
            if tok in hay:
                score += 1
        if score > 0:
            matches.append((score, c))
    matches.sort(key=lambda x: (-x[0], x[1].get("course_prefix", ""), x[1].get("course_number", "")))
    unique = []
    seen = set()
    for _, c in matches:
        key = (c.get("course_prefix"), c.get("course_number"))
        if key in seen:
            continue
        seen.add(key)
        unique.append(c)
        if len(unique) >= limit:
            break
    return unique


def run_rundown(campus_query: str) -> None:
    try:
        campus_key = find_best_campus_key(campus_query)
    except ValueError as err:
        print(str(err))
        # print available campuses
        print("\nAvailable campuses:")
        for k in campus_selector.CAMPUS_PERSONAS.keys():
            print(" -", k.replace("-", " ").title())
        return

    persona = campus_selector.CAMPUS_PERSONAS[campus_key]
    display_name = campus_key.replace("-", " ").title()

    print("\n" + "=" * 60)
    print(f"Campus rundown — {display_name}")
    print("=" * 60 + "\n")

    summary = persona.get("summary", "(no summary)")
    keywords = persona.get("keywords", [])
    focus_pairs = persona.get("focus_pairs", [])  # tuples (norm, display)

    print("Summary:")
    print(" ", summary, "\n")

    if keywords:
        print("Keywords:")
        print(" ", ", ".join(keywords[:8]))
        print()

    if focus_pairs:
        print("Notable programs / focus areas:")
        displays = [disp for (_, disp) in focus_pairs]
        print(" ", ", ".join(displays[:8]))
        print()

    # Try local reveal page link
    reveal = find_reveal_page(display_name)
    if reveal:
        print("Campus page (local):", reveal)
    else:
        print("Campus page (local): not found. You can add a page under `UH-Reveal-Pages/`.")
    print()

    # Try to show some example courses related to the top focus areas
    courses = load_course_catalogs()
    if not courses:
        print("No local course catalogs found under 'UH-courses/json_format/'.")
        return

    # Build a list of focus terms (display names split to words)
    focus_terms = []
    for (_, disp) in focus_pairs[:3]:
        # break display into meaningful tokens (no punctuation)
        parts = [p for p in disp.replace("&", "and").split() if len(p) > 2]
        if parts:
            focus_terms.append(" ".join(parts))

    if not focus_terms:
        print("No focus terms to search for courses.")
        return

    print("Example courses related to top focus areas:")
    for term in focus_terms:
        found = find_courses_for_focus(courses, [term], limit=3)
        print(f"\n  For '{term}':")
        if not found:
            print("   (no matches found in local catalogs)")
            continue
        for c in found:
            prefix = c.get("course_prefix") or c.get("prefix") or ""
            number = c.get("course_number") or c.get("number") or ""
            title = c.get("course_title") or c.get("title") or ""
            desc = (c.get("course_desc") or c.get("description") or "").strip()
            if len(desc) > 140:
                desc = desc[:137] + "..."
            print(f"   - {prefix} {number}: {title}")
            if desc:
                print(f"     {desc}")


if __name__ == "__main__":
    p = argparse.ArgumentParser(prog="campus_rundown.py")
    p.add_argument("--campus", "-c", help="Campus name (e.g., Manoa, Kapiolani)", required=True)
    args = p.parse_args()
    run_rundown(args.campus)
