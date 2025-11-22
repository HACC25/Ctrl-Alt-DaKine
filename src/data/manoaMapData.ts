import type { CourseCard } from '../utils/courseUtils';
import { normalize, normalizeCourseCode } from '../utils/courseUtils';

export type BuildingNode = {
  id: string;
  name: string;
  position: [number, number];
  height: number;
  footprint: [number, number];
  baseColor: string;
};

export type CourseLocationMeta = {
  buildingId: string;
  startMinutes?: number;
  durationMinutes?: number;
  color?: string;
};

export type ScheduleStop = {
  id: string;
  code: string;
  name: string;
  buildingId: string;
  buildingName: string;
  startTime: string;
  endTime: string;
  position: [number, number];
  color: string;
  description: string;
};

const buildingNodes: Record<string, BuildingNode> = {
  post: {
    id: 'post',
    name: 'Pacific Ocean Science & Technology (POST)',
    position: [-6, 10],
    height: 17,
    footprint: [30, 22],
    baseColor: '#0ea5e9',
  },
  keller: {
    id: 'keller',
    name: 'Keller Hall',
    position: [-18, 30],
    height: 16,
    footprint: [16, 12],
    baseColor: '#1d4ed8',
  },
  bilger: {
    id: 'bilger',
    name: 'Bilger Hall',
    position: [-26, -2],
    height: 13,
    footprint: [18, 14],
    baseColor: '#0284c7',
  },
  kuykendall: {
    id: 'kuykendall',
    name: 'Kuykendall Hall',
    position: [-24, 16],
    height: 13,
    footprint: [16, 18],
    baseColor: '#14b8a6',
  },
  hemenway: {
    id: 'hemenway',
    name: 'Hemenway Hall',
    position: [-46, 10],
    height: 11,
    footprint: [16, 12],
    baseColor: '#0f766e',
  },
  sinclair: {
    id: 'sinclair',
    name: 'Sinclair Library / Student Success Center',
    position: [22, 12],
    height: 10,
    footprint: [18, 14],
    baseColor: '#65a30d',
  },
  hamilton: {
    id: 'hamilton',
    name: 'Hamilton Library',
    position: [2, 34],
    height: 17,
    footprint: [32, 12],
    baseColor: '#15803d',
  },
  moore: {
    id: 'moore',
    name: 'Moore Hall',
    position: [36, 28],
    height: 12,
    footprint: [16, 12],
    baseColor: '#a855f7',
  },
  shidler: {
    id: 'shidler',
    name: 'Shidler College of Business',
    position: [40, -22],
    height: 14,
    footprint: [18, 16],
    baseColor: '#dc2626',
  },
  art: {
    id: 'art',
    name: 'Art Building',
    position: [10, -8],
    height: 11,
    footprint: [24, 12],
    baseColor: '#f97316',
  },
  hawaiihall: {
    id: 'hawaiihall',
    name: 'Hawaii Hall',
    position: [-32, 32],
    height: 12,
    footprint: [14, 12],
    baseColor: '#fbbf24',
  },
  saunders: {
    id: 'saunders',
    name: 'Saunders Hall',
    position: [-52, 30],
    height: 14,
    footprint: [12, 18],
    baseColor: '#d97706',
  },
  campuscenter: {
    id: 'campuscenter',
    name: 'Campus Center',
    position: [-32, -22],
    height: 8,
    footprint: [18, 12],
    baseColor: '#f97316',
  },
  warriorrec: {
    id: 'warriorrec',
    name: 'Warrior Recreation Center',
    position: [18, -30],
    height: 12,
    footprint: [16, 12],
    baseColor: '#ea580c',
  },
  stan: {
    id: 'stan',
    name: 'Stan Sheriff Center',
    position: [54, -36],
    height: 18,
    footprint: [28, 22],
    baseColor: '#9f1239',
  },
  kennedy: {
    id: 'kennedy',
    name: 'Kennedy Theatre',
    position: [32, 6],
    height: 12,
    footprint: [14, 10],
    baseColor: '#e11d48',
  },
  cmore: {
    id: 'cmore',
    name: 'C-MORE Hale / Marine Science Building',
    position: [-44, -8],
    height: 12,
    footprint: [16, 10],
    baseColor: '#0ea5e9',
  },
  snyder: {
    id: 'snyder',
    name: 'Snyder Hall',
    position: [-14, -12],
    height: 11,
    footprint: [14, 10],
    baseColor: '#4ade80',
  },
  watanabe: {
    id: 'watanabe',
    name: 'Watanabe Hall',
    position: [-6, -24],
    height: 13,
    footprint: [14, 10],
    baseColor: '#60a5fa',
  },
  marine: {
    id: 'marine',
    name: 'Marine Science Labs',
    position: [-36, -32],
    height: 11,
    footprint: [16, 12],
    baseColor: '#0891b2',
  },
  lawlibrary: {
    id: 'lawlibrary',
    name: 'William S. Richardson Law Library',
    position: [-4, -40],
    height: 14,
    footprint: [48, 14],
    baseColor: '#155e75',
  },
  businessannex: {
    id: 'businessannex',
    name: 'Business Annex',
    position: [-42, -30],
    height: 11,
    footprint: [16, 12],
    baseColor: '#0f172a',
  },
};

const buildingAliases: Record<string, string> = {
  postbuilding: 'post',
  pacificoceanscienceandtechnology: 'post',
  kellersciencebuilding: 'keller',
  kellerhall: 'keller',
  bilgerhall: 'bilger',
  kuykendallhall: 'kuykendall',
  hemenwayhall: 'hemenway',
  sinclairlibrary: 'sinclair',
  hamiltonlibrary: 'hamilton',
  moorehall: 'moore',
  shidlercollegeofbusiness: 'shidler',
  artbuilding: 'art',
  hawaiihall: 'hawaiihall',
  saundershall: 'saunders',
  campuscentercomplex: 'campuscenter',
  warriorreccenter: 'warriorrec',
  stansheriffcenter: 'stan',
  kennedytheatre: 'kennedy',
  cmorehale: 'cmore',
  cmorehalemarinesciencebuilding: 'cmore',
  snyderhall: 'snyder',
  watanabehall: 'watanabe',
  marinesciencebuilding: 'marine',
  lawlibrary: 'lawlibrary',
  williamrichardsonlawlibrary: 'lawlibrary',
  businessannex: 'businessannex',
};

const FALLBACK_COLORS = ['#34d399', '#22d3ee', '#f472b6', '#fb7185', '#facc15', '#c084fc'];
const SLOT_STARTS = [510, 585, 660, 735, 810, 885, 960];
const DEFAULT_DURATION = 75;

const courseLocationMeta: Record<string, CourseLocationMeta> = {
  ics111: { buildingId: 'post', startMinutes: 510, durationMinutes: 75, color: '#34d399' },
  ics141: { buildingId: 'keller', startMinutes: 600, durationMinutes: 75, color: '#2dd4bf' },
  ics110: { buildingId: 'post', startMinutes: 540, durationMinutes: 75 },
  math241: { buildingId: 'keller', startMinutes: 585, durationMinutes: 75, color: '#0ea5e9' },
  math215: { buildingId: 'keller', startMinutes: 600, durationMinutes: 75 },
  math140: { buildingId: 'keller', startMinutes: 585 },
  wrtg150: { buildingId: 'kuykendall', startMinutes: 690, durationMinutes: 70, color: '#a855f7' },
  eng100: { buildingId: 'kuykendall', startMinutes: 690, durationMinutes: 70 },
  eng190: { buildingId: 'kuykendall', startMinutes: 690 },
  cine255: { buildingId: 'art', startMinutes: 540, durationMinutes: 85, color: '#fb7185' },
  cine215: { buildingId: 'art', startMinutes: 600, durationMinutes: 85 },
  cine216: { buildingId: 'art', startMinutes: 705, durationMinutes: 85 },
  art113: { buildingId: 'art', startMinutes: 615, durationMinutes: 85, color: '#f97316' },
  bus310: { buildingId: 'shidler', startMinutes: 540, durationMinutes: 75, color: '#f87171' },
  econ130: { buildingId: 'kuykendall', startMinutes: 615, durationMinutes: 75 },
  biol171: { buildingId: 'snyder', startMinutes: 525, durationMinutes: 75, color: '#22c55e' },
  ocn201: { buildingId: 'marine', startMinutes: 660, durationMinutes: 75, color: '#0ea5e9' },
  hsl101: { buildingId: 'moore', startMinutes: 720, durationMinutes: 60, color: '#a855f7' },
  hsl102: { buildingId: 'moore', startMinutes: 720, durationMinutes: 60 },
  fg: { buildingId: 'hemenway', startMinutes: 765, durationMinutes: 60, color: '#0f766e' },
  fq: { buildingId: 'keller', startMinutes: 585, durationMinutes: 60 },
  fw: { buildingId: 'kuykendall', startMinutes: 690, durationMinutes: 60 },
  db: { buildingId: 'bilger', startMinutes: 570, durationMinutes: 75 },
  dp: { buildingId: 'bilger', startMinutes: 570, durationMinutes: 75 },
  dy: { buildingId: 'watanabe', startMinutes: 780, durationMinutes: 110 },
  ds: { buildingId: 'hawaiihall', startMinutes: 705, durationMinutes: 75 },
  elective: { buildingId: 'campuscenter', startMinutes: 840, durationMinutes: 60 },
  honors: { buildingId: 'sinclair', startMinutes: 900, durationMinutes: 60 },
  lab: { buildingId: 'watanabe', startMinutes: 780, durationMinutes: 110 },
};

const generalMatchers: Array<{ predicate: (course: CourseCard) => boolean; meta: CourseLocationMeta }> = [
  {
    predicate: (course) => /^hsl/i.test(course.code || course.name),
    meta: { buildingId: 'moore', startMinutes: 720, durationMinutes: 60, color: '#a855f7' },
  },
  {
    predicate: (course) => /writing|english|composition|fw/i.test(course.name),
    meta: { buildingId: 'kuykendall', startMinutes: 690, durationMinutes: 65, color: '#a855f7' },
  },
  {
    predicate: (course) => /lab/i.test(course.name),
    meta: { buildingId: 'watanabe', startMinutes: 780, durationMinutes: 105, color: '#f97316' },
  },
  {
    predicate: (course) => /physics|chem|bio|db|dp/i.test(course.name),
    meta: { buildingId: 'bilger', startMinutes: 570, durationMinutes: 75, color: '#0ea5e9' },
  },
  {
    predicate: (course) => /math|calculus|f[q]/i.test(course.name),
    meta: { buildingId: 'keller', startMinutes: 585, durationMinutes: 75, color: '#22d3ee' },
  },
  {
    predicate: (course) => /global|history|fg|anth/i.test(course.name),
    meta: { buildingId: 'hemenway', startMinutes: 765, durationMinutes: 60, color: '#0f766e' },
  },
  {
    predicate: (course) => /elective|seminar/i.test(course.name),
    meta: { buildingId: 'campuscenter', startMinutes: 840, durationMinutes: 60, color: '#f59e0b' },
  },
];

function normalizeMetaKey(value?: string | null): string {
  return value ? value.toString().toLowerCase().replace(/[^a-z0-9]+/g, '') : '';
}

function resolveBuildingId(name?: string | null): string {
  const key = normalize(name);
  if (buildingNodes[key]) return key;
  if (buildingAliases[key]) return buildingAliases[key];
  return 'campuscenter';
}

function resolveCourseMeta(course: CourseCard): CourseLocationMeta {
  const codeKey = normalizeMetaKey(course.code) || normalizeCourseCode(course.code);
  if (codeKey && courseLocationMeta[codeKey]) {
    return courseLocationMeta[codeKey];
  }

  const nameKey = normalizeMetaKey(course.name);
  if (nameKey && courseLocationMeta[nameKey]) {
    return courseLocationMeta[nameKey];
  }

  for (const matcher of generalMatchers) {
    if (matcher.predicate(course)) {
      return matcher.meta;
    }
  }

  return { buildingId: resolveBuildingId(course.location) };
}

function defaultStartByIndex(index: number): number {
  if (index < SLOT_STARTS.length) return SLOT_STARTS[index];
  const overflow = index - SLOT_STARTS.length + 1;
  return SLOT_STARTS[SLOT_STARTS.length - 1] + overflow * 90;
}

function formatMinutes(totalMinutes: number): string {
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours24 = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const suffix = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${suffix}`;
}

export function getBuildingById(id: string): BuildingNode {
  return buildingNodes[id] || buildingNodes.campuscenter;
}

export function buildScheduleStop(course: CourseCard, index: number): ScheduleStop {
  const meta = resolveCourseMeta(course);
  const buildingId = meta.buildingId || resolveBuildingId(course.location);
  const building = getBuildingById(buildingId);
  const startMinutes = meta.startMinutes ?? defaultStartByIndex(index);
  const duration = meta.durationMinutes ?? DEFAULT_DURATION;
  const color = meta.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length];

  return {
    id: course.id || `stop-${index}`,
    code: course.code,
    name: course.name,
    buildingId: building.id,
    buildingName: building.name,
    startTime: formatMinutes(startMinutes),
    endTime: formatMinutes(startMinutes + duration),
    position: building.position,
    color,
    description: course.description,
  };
}

export function getBuildingsForSchedule(schedule: ScheduleStop[]): BuildingNode[] {
  const unique = new Map<string, BuildingNode>();
  schedule.forEach((stop) => {
    if (!unique.has(stop.buildingId)) {
      unique.set(stop.buildingId, getBuildingById(stop.buildingId));
    }
  });
  return Array.from(unique.values());
}

export const manoaBuildingList = Object.values(buildingNodes);
