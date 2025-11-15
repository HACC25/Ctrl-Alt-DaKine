"""
Simple test to verify the freshman_courses_selector works
"""
import json
import os

base_path = os.path.dirname(os.path.abspath(__file__))
parent_path = os.path.dirname(base_path)

pathways_file = os.path.join(parent_path, "UH-courses", "manoa_degree_pathways.json")
courses_file = os.path.join(parent_path, "UH-courses", "json_format", "manoa_courses.json")
schedule_file = os.path.join(base_path, "course_schedule.json")

print(f"Base path: {base_path}")
print(f"Parent path: {parent_path}")
print(f"\nPathways file: {pathways_file}")
print(f"Exists: {os.path.exists(pathways_file)}")

print(f"\nCourses file: {courses_file}")
print(f"Exists: {os.path.exists(courses_file)}")

print(f"\nSchedule file: {schedule_file}")
print(f"Exists: {os.path.exists(schedule_file)}")

# Try loading pathways
try:
    with open(pathways_file, 'r', encoding='utf-8') as f:
        pathways = json.load(f)
    print(f"\n✓ Successfully loaded pathways ({len(pathways)} programs)")
except Exception as e:
    print(f"\n✗ Error loading pathways: {e}")

# Try loading courses
try:
    with open(courses_file, 'r', encoding='utf-8') as f:
        courses = json.load(f)
    print(f"✓ Successfully loaded courses ({len(courses)} courses)")
except Exception as e:
    print(f"✗ Error loading courses: {e}")

# Try loading schedule
try:
    with open(schedule_file, 'r', encoding='utf-8') as f:
        schedule = json.load(f)
    print(f"✓ Successfully loaded schedule ({len(schedule)} entries)")
except Exception as e:
    print(f"✗ Error loading schedule: {e}")
