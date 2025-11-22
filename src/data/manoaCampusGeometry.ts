import { getBuildingById } from './manoaMapData';

export type BuildingFootprint = {
  id: string;
  center: [number, number];
  size: [number, number];
  height: number;
  rotation?: number;
  color: string;
};

export type RoadPath = Array<[number, number]>;

const focusBuildingIds = [
  'saunders',
  'hawaiihall',
  'keller',
  'hamilton',
  'moore',
  'post',
  'kuykendall',
  'sinclair',
  'bilger',
  'hemenway',
  'snyder',
  'watanabe',
  'art',
  'campuscenter',
  'lawlibrary',
  'businessannex',
  'shidler',
];

const focusPalette = ['#111827', '#1f2937', '#374151', '#4b5563'];

export const buildingFootprints: BuildingFootprint[] = focusBuildingIds.map((id, index) => {
  const building = getBuildingById(id);
  return {
    id,
    center: building.position,
    size: building.footprint,
    height: building.height,
    color: focusPalette[index % focusPalette.length],
  };
});

export const campusRoadLoops: RoadPath[] = [
  [
    [-70, 46],
    [-36, 48],
    [0, 48],
    [34, 46],
    [58, 38],
    [70, 16],
    [66, -10],
    [50, -34],
    [18, -50],
    [-16, -52],
    [-48, -44],
    [-68, -26],
    [-74, 2],
    [-70, 46],
  ],
  [
    [-52, 18],
    [-32, 24],
    [-10, 26],
    [14, 24],
    [32, 18],
    [42, 4],
    [40, -12],
    [24, -24],
    [4, -32],
    [-20, -30],
    [-36, -20],
    [-46, -6],
    [-52, 6],
    [-52, 18],
  ],
];

export const campusCarRoute: RoadPath = [
  [-60, -18],
  [-44, -34],
  [-12, -40],
  [18, -36],
  [40, -22],
  [52, -2],
  [50, 18],
  [30, 34],
  [2, 38],
  [-26, 36],
  [-44, 26],
  [-60, 6],
  [-62, -6],
  [-60, -18],
];
