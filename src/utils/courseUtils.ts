import courseCatalog from '../../UH-courses/json_format/manoa_courses.json';

type RawCatalogEntry = Record<string, any>;

export type CourseCard = {
  id: string;
  code: string;
  name: string;
  credits: number;
  location: string;
  description: string;
};

const catalogArray = courseCatalog as RawCatalogEntry[];
const courseLookup: Record<string, RawCatalogEntry> = catalogArray.reduce((acc, course) => {
  const key = normalizeCourseCode(
    `${course.course_prefix || ''} ${course.course_number || ''}`.trim()
  );
  if (key) acc[key] = course;
  return acc;
}, {} as Record<string, RawCatalogEntry>);

export function normalize(value?: string | null): string {
  return value ? value.toString().toLowerCase().replace(/[^a-z0-9]+/g, '') : '';
}

export function normalizeCourseCode(value?: string | null): string {
  return value ? value.toString().toLowerCase().replace(/\s+/g, '') : '';
}

export function shapeCourse(course: any, fallbackId: string): CourseCard {
  const rawName = course?.name || '';
  const match = rawName.match?.(/([A-Z]{2,4})\s*(\d{3}[A-Z]?)/);
  const catalogKey = match
    ? normalizeCourseCode(match[0])
    : normalizeCourseCode(rawName);
  const catalogEntry = catalogKey ? courseLookup[catalogKey] : undefined;

  const courseCode = match?.[0] || course?.course_code || course?.code || rawName || fallbackId;

  let courseName = '';
  if (course?.title) {
    courseName = course.title;
  } else if (match && rawName) {
    courseName = rawName.replace(match[0], '').replace(/^[\s\-:]+/, '').trim();
    if (!courseName) {
      courseName = catalogEntry?.course_title || rawName;
    }
  } else {
    courseName = catalogEntry?.course_title || rawName || `Course ${fallbackId}`;
  }

  if (!courseName || courseName === courseCode) {
    courseName = catalogEntry?.course_title || 'Course';
  }

  const credits =
    course?.credits ||
    Number(catalogEntry?.num_units) ||
    course?.credit ||
    Number(course?.num_units) ||
    3;

  return {
    id: String(course?.id || catalogKey || fallbackId),
    code: courseCode,
    name: courseName,
    credits,
    location: course?.location || catalogEntry?.dept_name || 'UH Mānoa',
    description:
      course?.description ||
      course?.course_desc ||
      catalogEntry?.course_desc ||
      'Course details coming soon.',
  };
}

export function lookupCourse(codeOrName: string): RawCatalogEntry | undefined {
  return courseLookup[normalizeCourseCode(codeOrName)];
}
