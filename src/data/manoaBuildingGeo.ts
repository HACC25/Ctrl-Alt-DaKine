export type BuildingCoordinate = {
  lat: number;
  lng: number;
  label: string;
};

export const campusCenter: BuildingCoordinate = {
  lat: 21.2992,
  lng: -157.8174,
  label: 'UH Mānoa Campus',
};

export const buildingCoordinates: Record<string, BuildingCoordinate> = {
  post: { lat: 21.2979, lng: -157.8172, label: 'POST' },
  keller: { lat: 21.2979, lng: -157.8165, label: 'Keller Hall' },
  bilger: { lat: 21.2972, lng: -157.8177, label: 'Bilger Hall' },
  kuykendall: { lat: 21.2988, lng: -157.8167, label: 'Kuykendall Hall' },
  hemenway: { lat: 21.2995, lng: -157.8184, label: 'Hemenway Hall' },
  sinclair: { lat: 21.2999, lng: -157.8173, label: 'Sinclair Library' },
  hamilton: { lat: 21.3006, lng: -157.8181, label: 'Hamilton Library' },
  moore: { lat: 21.2997, lng: -157.8161, label: 'Moore Hall' },
  shidler: { lat: 21.2949, lng: -157.8183, label: 'Shidler College of Business' },
  art: { lat: 21.2976, lng: -157.8159, label: 'Art Building' },
  hawaiihall: { lat: 21.3007, lng: -157.8176, label: 'Hawaii Hall' },
  saunders: { lat: 21.3016, lng: -157.8164, label: 'Saunders Hall' },
  campuscenter: { lat: 21.2978, lng: -157.817, label: 'Campus Center' },
  warriorrec: { lat: 21.2964, lng: -157.8175, label: 'Warrior Rec Center' },
  stan: { lat: 21.2938, lng: -157.8167, label: 'Stan Sheriff Center' },
  kennedy: { lat: 21.2997, lng: -157.8153, label: 'Kennedy Theatre' },
  cmore: { lat: 21.296, lng: -157.8184, label: 'C-MORE Hale' },
  snyder: { lat: 21.2973, lng: -157.8166, label: 'Snyder Hall' },
  watanabe: { lat: 21.2974, lng: -157.8173, label: 'Watanabe Hall' },
  marine: { lat: 21.2949, lng: -157.819, label: 'Marine Science Building' },
  lawlibrary: { lat: 21.2962, lng: -157.8162, label: 'Law Library' },
  businessannex: { lat: 21.2955, lng: -157.8178, label: 'Business Annex' },
  holmes: { lat: 21.3004, lng: -157.8146, label: 'Holmes Hall' },
  qlc: { lat: 21.3009, lng: -157.8167, label: 'Queen Liliuokalani Center' },
  anderson: { lat: 21.3013, lng: -157.8179, label: 'Anderson Hall' },
  hawaiianstudies: { lat: 21.302, lng: -157.8185, label: 'Kamakakuokalani Center for Hawaiian Studies' },
  henke: { lat: 21.3003, lng: -157.819, label: 'Henke Hall' },
  hamiltonmall: { lat: 21.3011, lng: -157.8188, label: 'Upper Campus Promenade' },
  // Parking
  parking_zone20: { lat: 21.2935, lng: -157.8185, label: 'Zone 20 Parking Structure' },
  parking_zone22: { lat: 21.2968, lng: -157.8135, label: 'Dole St Parking Structure' },
  // Food
  food_paradisepalms: { lat: 21.3002, lng: -157.8168, label: 'Paradise Palms Cafe' },
  food_starbucks_gateway: { lat: 21.2955, lng: -157.8145, label: 'Starbucks (Gateway)' },
  food_campuscenter: { lat: 21.2982, lng: -157.8174, label: 'Campus Center Food Court' },
};
