"""
Script to extract freshman-year courses from UH degree pathways and course data.
This module demonstrates how to read the manoa_degree_pathways.json and corresponding
course files to select ~3 courses a student would take in their freshman year.
"""

import json
import os
from typing import List, Dict, Any, Optional


def load_json_file(file_path: str) -> Any:
    """Load and parse a JSON file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: File not found at {file_path}")
        return None
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON in {file_path}")
        return None


def get_freshman_courses(pathways_data: List[Dict]) -> List[Dict]:
    """
    Extract all freshman year courses from degree pathways.
    
    Args:
        pathways_data: List of degree pathway dictionaries
        
    Returns:
        List of dictionaries containing program name and freshman courses
    """
    freshman_courses_list = []
    
    for program in pathways_data:
        if not program.get('years'):
            continue
            
        # Get year 1 (freshman year)
        for year in program['years']:
            if year.get('year_number') == 1:
                courses = {
                    'program_name': program.get('program_name'),
                    'institution': program.get('institution'),
                    'total_credits': program.get('total_credits'),
                    'freshman_courses': []
                }
                
                # Collect all courses from fall and spring semesters
                for semester in year.get('semesters', []):
                    if semester.get('semester_name') in ['fall_semester', 'spring_semester']:
                        for course in semester.get('courses', []):
                            courses['freshman_courses'].append({
                                'name': course.get('name'),
                                'credits': course.get('credits'),
                                'semester': semester.get('semester_name')
                            })
                
                freshman_courses_list.append(courses)
    
    return freshman_courses_list


def find_course_details(courses_data: List[Dict], course_name: str) -> Optional[Dict]:
    """
    Find detailed information about a specific course.
    
    Args:
        courses_data: List of course dictionaries from manoa_courses.json
        course_name: Name of the course (e.g., "CINE 255")
        
    Returns:
        Dictionary with course details or None if not found
    """
    # Parse course prefix and number from course name
    parts = course_name.split()
    if len(parts) < 2:
        return None
    
    prefix = parts[0]
    number = parts[1].split('(')[0]  # Remove any suffix like "(DH)"
    
    # Search for matching course
    for course in courses_data:
        if (course.get('course_prefix') == prefix and 
            course.get('course_number') == number):
            return course
    
    return None


def find_course_schedule(schedule_data: List[Dict], course_name: str, 
                        semester: str = None) -> Optional[List[Dict]]:
    """
    Find schedule information for a specific course.
    
    Args:
        schedule_data: List of schedule dictionaries from course_schedule.json
        course_name: Name of the course (e.g., "CINE 255" or "CINE 255 (DH)")
        semester: Filter by semester (e.g., "fall_semester", "spring_semester")
        
    Returns:
        List of schedule entries or None if not found
    """
    if not schedule_data:
        return None
    
    # Remove any suffixes from course name (e.g., " (DH)")
    clean_course_name = course_name.split('(')[0].strip()
    
    matching_schedules = []
    
    for entry in schedule_data:
        entry_course = entry.get('course_name', '')
        if entry_course == clean_course_name:
            if semester is None or entry.get('semester') == semester:
                matching_schedules.append(entry)
    
    return matching_schedules if matching_schedules else None


def select_top_freshman_courses(program_courses: Dict, courses_data: List[Dict], 
                               limit: int = 3) -> List[Dict]:
    """
    Select top ~3 courses from freshman year, preferring major-specific courses.
    
    Args:
        program_courses: Dictionary containing program info and freshman courses
        courses_data: List of detailed course information
        limit: Number of courses to select
        
    Returns:
        List of selected courses with full details
    """
    selected_courses = []
    priority_keywords = ['CINE', 'ART', 'DNCE', 'THEA']  # Program-specific courses
    
    freshman = program_courses.get('freshman_courses', [])
    
    # First pass: get major-specific courses
    for course in freshman:
        course_name = course.get('name', '')
        for keyword in priority_keywords:
            if keyword in course_name and len(selected_courses) < limit:
                course_details = find_course_details(courses_data, course_name)
                if course_details:
                    selected_courses.append({
                        'pathway_info': course,
                        'course_details': course_details
                    })
    
    # Second pass: fill remaining slots with any courses
    if len(selected_courses) < limit:
        for course in freshman:
            if len(selected_courses) >= limit:
                break
            course_name = course.get('name', '')
            # Check if not already selected
            if not any(sc['pathway_info']['name'] == course_name for sc in selected_courses):
                course_details = find_course_details(courses_data, course_name)
                if course_details:
                    selected_courses.append({
                        'pathway_info': course,
                        'course_details': course_details
                    })
    
    return selected_courses


def print_course_info(selected_courses: List[Dict], schedule_data: Optional[List[Dict]] = None) -> None:
    """Pretty print the selected courses with optional schedule information."""
    print("\n" + "="*80)
    print("SELECTED FRESHMAN YEAR COURSES")
    print("="*80 + "\n")
    
    for i, course_info in enumerate(selected_courses, 1):
        pathway = course_info.get('pathway_info', {})
        details = course_info.get('course_details', {})
        
        print(f"{i}. {pathway.get('name')} ({pathway.get('credits')} credits)")
        print(f"   Semester: {pathway.get('semester').replace('_', ' ').title()}")
        
        if details:
            print(f"   Title: {details.get('course_title')}")
            print(f"   Description: {details.get('course_desc')}")
            if details.get('metadata'):
                print(f"   Prerequisites: {details.get('metadata')}")
        
        # Print schedule information if available
        if schedule_data:
            schedules = find_course_schedule(schedule_data, pathway.get('name'), 
                                            pathway.get('semester'))
            if schedules:
                print(f"   Schedule:")
                for schedule in schedules:
                    days = schedule.get('days', 'N/A')
                    start_time = schedule.get('start_time', 'N/A')
                    end_time = schedule.get('end_time', 'N/A')
                    location = schedule.get('location', 'N/A')
                    instructor = schedule.get('instructor', 'N/A')
                    print(f"      • {days} {start_time}-{end_time} | {location} | {instructor}")
            else:
                print(f"   Schedule: Not available")
        
        print()


def main(pathways_file: str, courses_file: str, 
         schedule_file: Optional[str] = None,
         program_filter: Optional[str] = None) -> None:
    """
    Main function to extract and display freshman courses.
    
    Args:
        pathways_file: Path to manoa_degree_pathways.json
        courses_file: Path to manoa_courses.json
        schedule_file: Optional path to course_schedule.json
        program_filter: Optional filter to select specific program (e.g., "Animation")
    """
    print("Loading degree pathway data...")
    pathways_data = load_json_file(pathways_file)
    if not pathways_data:
        return
    
    print("Loading course data...")
    courses_data = load_json_file(courses_file)
    if not courses_data:
        return
    
    schedule_data = None
    if schedule_file and os.path.exists(schedule_file):
        print("Loading schedule data...")
        schedule_data = load_json_file(schedule_file)
    
    print("Extracting freshman year courses...\n")
    
    # Get all freshman courses
    all_freshman = get_freshman_courses(pathways_data)
    
    # Filter by program if specified
    programs_to_process = all_freshman
    if program_filter:
        programs_to_process = [p for p in all_freshman 
                              if program_filter.lower() in p['program_name'].lower()]
        
        if not programs_to_process:
            print(f"No programs found matching '{program_filter}'")
            print("\nAvailable programs:")
            for p in all_freshman:
                print(f"  - {p['program_name']}")
            return
    
    # Process each program
    for program in programs_to_process:
        print(f"\nProgram: {program['program_name']}")
        print(f"Institution: {program['institution']}")
        print(f"Total Credits Required: {program['total_credits']}")
        print(f"Freshman Courses: {len(program['freshman_courses'])}")
        
        # Select top 3 courses
        selected = select_top_freshman_courses(program, courses_data, limit=3)
        print_course_info(selected, schedule_data)


if __name__ == "__main__":
    # Define file paths
    base_path = os.path.dirname(os.path.abspath(__file__))
    parent_path = os.path.dirname(base_path)
    
    pathways_file = os.path.join(parent_path, "UH-courses", "manoa_degree_pathways.json")
    courses_file = os.path.join(parent_path, "UH-courses", "json_format", "manoa_courses.json")
    schedule_file = os.path.join(base_path, "course_schedule.json")
    
    # Run for Animation program specifically
    main(pathways_file, courses_file, schedule_file, program_filter="Animation")
