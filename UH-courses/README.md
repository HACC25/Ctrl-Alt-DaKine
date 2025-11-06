# UH-courses

This repository contains course data from various University of Hawaii (UH) campuses and the Pacific Center for Advanced Technology Training (PCATT). The data is available in both JSON and CSV formats.

# UH Manoa Degrees

Degree pathways for UH Manoa are located in the manoa_degree_pathways.json file and lists courses and semesters recommended for a standard degree.

Additional Degree Programs from each UH instituion can be found in their catalogs:
- UH Manoa - https://catalog.manoa.hawaii.edu/
- UH Hilo - https://hilo.hawaii.edu/catalog/
- UH West Oahu - https://westoahu.hawaii.edu/academics/general-catalog/
- UH Maui College - https://maui.hawaii.edu/catalog
- UH Leeward Community College - https://www.leeward.hawaii.edu/catalog#/home
- UH Windward Community College - https://catalog.windward.hawaii.edu/
- UH Hawaii Community College - https://www.hawaii.hawaii.edu/catalog
- UH Kapiolani Community College - https://www.kapiolani.hawaii.edu/classes/general-catalog/
- UH Kaua Community College - https://catalog.kauai.hawaii.edu/

## Data Structure

### File Organization

- **`json_format/`** - Contains all course data in JSON format
- **Root directory** - Contains all course data in CSV format

### Available Datasets

#### UH Campus Course Data (JSON and CSV)
- `hawaiicc_courses` - Hawaii Community College
- `hilo_courses` - University of Hawaii at Hilo
- `honolulucc_courses` - Honolulu Community College
- `kapiolani_courses` - Kapiolani Community College
- `kauai_courses` - Kauai Community College
- `leeward_courses` - Leeward Community College
- `manoa_courses` - University of Hawaii at Manoa
- `maui_courses` - University of Hawaii Maui College
- `west_oahu_courses` - University of Hawaii West Oahu
- `windward_courses` - Windward Community College

#### PCATT Course Data (JSON and CSV)
- `pcatt_courses` - Pacific Center for Advanced Technology Training

#### UH Manoa Degree Pathways (JSON)
- `manoa_degree_pathways.json`
- 
## Data Fields

### Standard UH Campus Courses (8 fields)

| Field | Type | Description |
|-------|------|-------------|
| `course_prefix` | String | Course subject prefix (e.g., "Acc", "Eng", "Math") |
| `course_number` | String | Course number (e.g., "124", "100", "201") |
| `course_title` | String | Full course title |
| `course_desc` | String | Detailed course description |
| `num_units` | String | Number of credit units (e.g., "3", "4") |
| `dept_name` | String | Department name offering the course |
| `inst_ipeds` | Integer | IPEDS institution identifier |
| `metadata` | String | Additional course information (prerequisites, hours, etc.) |

### PCATT Courses (7 fields)

PCATT courses have the same structure as UH campus courses but **exclude** the `num_units` field:

| Field | Type | Description |
|-------|------|-------------|
| `course_prefix` | String | Course subject prefix (e.g., "Com") |
| `course_number` | String | Course number (e.g., "2158", "2162") |
| `course_title` | String | Full course title |
| `course_desc` | String | Detailed course description |
| `dept_name` | String | Always "Pacific Center for Advanced Technology Training" |
| `inst_ipeds` | Integer | IPEDS institution identifier (383190) |
| `metadata` | String | Additional course information (prerequisites, hours, etc.) |

### UH Manoa Degree Pathways 

UH Manoa Degree Pathways with the follwowing structure and fields:

| Field | Type | Description |
|-------|------|-------------|
| `program_name` | String | Degree title (e.g. "Bachelor of Arts (BA) in Cinematic Arts (Animation Track)")
| `institution` | String | Name of institution (e.g. "University of Hawai\u02bbi at Manoa")
| `total_credits` | Integer | Number of credits for completing the degree (e.g 120)
| `years`| Array | A list of the year objects that contain nested fields

##### Each `year` object contains:

| Field             | Type     | Description |
|------------------|----------|-------------|
| `year_number`    | Integer  | Academic year number (e.g. 1 for freshman year) |
| `semesters`      | Array    | List of semesters in the year (fall, spring, summer), each with courses and credit totals |

##### Each `semester` object contains:

| Field             | Type     | Description |
|------------------|----------|-------------|
| `semester_name`  | String   | Name of the semester (e.g. "fall_semester") |
| `credits`        | Integer  | Total number of credits for the semester |
| `courses`        | Array    | List of courses taken during the semester |

##### Each `course` object contains:

| Field             | Type     | Description |
|------------------|----------|-------------|
| `name`           | String   | Course name and code (e.g. "CINE 255 (DH)") |
| `credits`        | Integer  | Number of credits for the course |

   
## Data Formats

### Course JSON Format
- Files are located in the `json_format/` directory
- Each file contains an array of course objects
- UTF-8 encoded with proper JSON formatting
- Example structure:
```json
[
  {
    "course_prefix": "Acc",
    "course_number": "124",
    "course_title": "Principles of Accounting I",
    "course_desc": "Accounting theory and methods...",
    "num_units": "3",
    "dept_name": "Accounting",
    "inst_ipeds": 383190,
    "metadata": "Pre: 'C' or better in Eng 21..."
  }
]
```

### Course CSV Format
- Files are located in the root directory
- First row contains column headers
- UTF-8 encoded with comma-separated values
- Text fields containing commas are properly quoted
- Example structure:
```csv
course_prefix,course_number,course_title,course_desc,num_units,dept_name,inst_ipeds,metadata
Acc,124,Principles of Accounting I,Accounting theory and methods...,3,Accounting,383190,"Pre: 'C' or better in Eng 21..."
```

### UH Manoa Degree Patheways JSON Format

- File is located in the root structure
- The file contains a list of program degree objects
- UTF-8 encoded with proper JSON formatting
- Example structure:
```json
[
{
    "program_name": "Bachelor of Arts (BA) in Cinematic Arts (Animation Track)",
    "institution": "University of Hawai\u02bbi at M\u0101noa",
    "total_credits": 120,
    "years": [
      {
        "year_number": 1,
        "semesters": [
          {
            "semester_name": "fall_semester",
            "credits": 15,
            "courses": [
              {
                "name": "CINE 255 (DH)",
                "credits": 3
              },
              {
                "name": "ART 113",
                "credits": 3
              },
              {
                "name": "FQ (or FW)",
                "credits": 3
              },
              {
                "name": "FG (A/B/C)",
                "credits": 3
              },
              {
                "name": "HSL 101",
                "credits": 3
              }
            ]
          },
          {
            "semester_name": "spring_semester",
            "credits": 15,
            "courses": [
              {
                "name": "CINE 215 (DA)",
                "credits": 3
              },
              {
                "name": "CINE 216 (DA)",
                "credits": 3
              },
              {
                "name": "FW (or FQ)",
                "credits": 3
              },
              {
                "name": "FG (A/B/C)",
                "credits": 3
              },
              {
                "name": "HSL 102",
                "credits": 3
              }
            ]
          },
          {
            "semester_name": "summer_semester",
            "credits": 0,
            "courses": []
          }
        ]
      },
      {
        "year_number": 2,
        "semesters": [
          {
            "semester_name": "fall_semester",
            "credits": 15,
            "courses": [
              {
                "name": "CINE 350",
                "credits": 3
              },
              {
                "name": "CINE 315 or 321",
                "credits": 3
              },
              {
                "name": "DB (or DP)",
                "credits": 3
              },
              {
                "name": "DY",
                "credits": 1
              },
              {
                "name": "HSL 201",
                "credits": 3
              },
              {
                "name": "Elective",
                "credits": 2
              }
            ]
          },
          {
            "semester_name": "spring_semester",
            "credits": 15,
            "courses": [
              {
                "name": "CINE 360",
                "credits": 3
              },
              {
                "name": "CINE 316 or 322",
                "credits": 3
              },
              {
                "name": "DP (or DB)",
                "credits": 3
              },
              {
                "name": "DS",
                "credits": 3
              },
              {
                "name": "HSL 202",
                "credits": 3
              }
            ]
          },
          {
            "semester_name": "summer_semester",
            "credits": 0,
            "courses": []
          }
        ]
      },
      {
        "year_number": 3,
        "semesters": [
          {
            "semester_name": "fall_semester",
            "credits": 15,
            "courses": [
              {
                "name": "CINE 385",
                "credits": 3
              },
              {
                "name": "CINE 317 or 323",
                "credits": 3
              },
              {
                "name": "CINE Track Elective 300+",
                "credits": 3
              },
              {
                "name": "DS",
                "credits": 3
              },
              {
                "name": "Elective",
                "credits": 3
              }
            ]
          },
          {
            "semester_name": "spring_semester",
            "credits": 15,
            "courses": [
              {
                "name": "CINE 418",
                "credits": 3
              },
              {
                "name": "CINE 460",
                "credits": 3
              },
              {
                "name": "Elective",
                "credits": 3
              },
              {
                "name": "Elective",
                "credits": 3
              },
              {
                "name": "Elective",
                "credits": 3
              }
            ]
          },
          {
            "semester_name": "summer_semester",
            "credits": 0,
            "courses": []
          }
        ]
      },
      {
        "year_number": 4,
        "semesters": [
          {
            "semester_name": "fall_semester",
            "credits": 15,
            "courses": [
              {
                "name": "CINE 420",
                "credits": 3
              },
              {
                "name": "Elective 300+",
                "credits": 3
              },
              {
                "name": "Elective 300+",
                "credits": 3
              },
              {
                "name": "Elective",
                "credits": 3
              },
              {
                "name": "Elective",
                "credits": 3
              }
            ]
          },
          {
            "semester_name": "spring_semester",
            "credits": 15,
            "courses": [
              {
                "name": "CINE Track Elective 300+",
                "credits": 3
              },
              {
                "name": "Elective 300+",
                "credits": 3
              },
              {
                "name": "Elective 300+",
                "credits": 3
              },
              {
                "name": "Elective",
                "credits": 3
              },
              {
                "name": "Elective",
                "credits": 3
              }
            ]
          },
          {
            "semester_name": "summer_semester",
            "credits": 0,
            "courses": []
          }
        ]
      }
    ]
  }
]
```

## Institution IPEDS Codes

| Institution | IPEDS Code |
|-------------|------------|
| Hawaii Community College | 383190 |
| University of Hawaii at Hilo | 141990 |
| Honolulu Community College | 141680 |
| Kapiolani Community College | 141796 |
| Kauai Community College | 141802 |
| Leeward Community College | 141811 |
| University of Hawaii at Manoa | 141574 |
| University of Hawaii Maui College | 141839 |
| University of Hawaii West Oahu | 141981 |
| Windward Community College | 141990 |
| Pacific Center for Advanced Technology Training | 383190 |

## Usage Notes

- All course data is current as of the last update
- Course descriptions and metadata may contain special characters and formatting
- Some courses may have empty or minimal metadata fields
- PCATT courses focus on technology training and certification programs
- UH campus courses represent traditional academic offerings

## File Sizes

The dataset includes thousands of courses across all institutions, with the largest files being:
- `manoa_courses` (University of Hawaii at Manoa) - largest dataset
- `kapiolani_courses` (Kapiolani Community College)
- `maui_courses` (University of Hawaii Maui College)


