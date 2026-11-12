import { create } from 'zustand';
import {
  ActiveTab,
  BusinessType,
  CameraMode,
  DesignStyle,
  FurnitureItem,
  POICategory,
  ParsedSearchIntent,
  PropertyItem,
  RouteResult,
  TransportMode,
  WeatherMode,
} from '@/types';
import { DEMO_PROPERTIES } from '@/data/demoProperties';
import {
  DESIGN_STYLE_META,
  generateLayoutPresets,
  parseNaturalLanguageQuery,
  scorePropertyForIntent,
} from '@/lib/aiEngine';
import { fetchRouteToPOI } from '@/lib/geoUtils';

const ALL_POI_CATEGORIES: POICategory[] = [
  'university',
  'office',
  'apartment',
  'mall',
  'cafe_restaurant',
  'competitor',
  'parking',
  'bus_stop',
  'hospital',
];

const initialProperty = DEMO_PROPERTIES[0];
const initialBusinessType: BusinessType = 'coffee_shop';
const initialDesignStyle: DesignStyle = 'scandinavian';
const initialPresets = generateLayoutPresets(
  initialProperty,
  initialBusinessType,
  initialDesignStyle
);
const initialPreset = initialPresets[0];

export interface SpaceVisionState {
  activeTab: ActiveTab;
  sidebarCollapsed: boolean;
  properties: PropertyItem[];
  selectedPropertyId: string;
  comparedPropertyIds: string[];
  searchQuery: string;
  parsedIntent: ParsedSearchIntent | null;
  filterDistrict: string;
  filterMaxRent: number;
  filterMinArea: number;
  selectedBusinessType: BusinessType;
  selectedDesignStyle: DesignStyle;
  activePOICategories: POICategory[];
  selectedPOIIds: string[];
  transportMode: TransportMode;
  activeRoutes: RouteResult[];
  isRoutingLoading: boolean;
  selectedFloor: number | 'all';
  selectedRoomId: string | null;
  cameraMode: CameraMode;
  showFurniture: boolean;
  showDimensions: boolean;
  view2D3DMode: '3d' | '2d' | 'split';
  timeOfDayHours: number;
  dayOfYear: number;
  weatherMode: WeatherMode;
  autoInteriorLights: boolean;
  activePresetId: string;
  furnitureItems: FurnitureItem[];
  selectedFurnitureId: string | null;
  hiddenFurnitureCategories: string[];

  // 3D Map building extrusion controls
  map3DBuildings: boolean;
  mapPitch: number;

  // Onboarding & Help Guide
  showOnboardingGuide: boolean;
  openOnboardingGuide: () => void;
  closeOnboardingGuide: () => void;

  // Actions
  setActiveTab: (tab: ActiveTab) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  selectProperty: (id: string) => void;
  toggleCompareProperty: (id: string) => void;
  runNaturalLanguageSearch: (query: string) => void;
  searchFromLanding: (
    query: string,
    businessType?: BusinessType,
    district?: string
  ) => void;
  exploreProperty3D: (id: string) => void;
  viewPropertyOnMap: (id: string) => void;
  setFilterDistrict: (district: string) => void;
  setFilterMaxRent: (maxRent: number) => void;
  setFilterMinArea: (minArea: number) => void;
  setSelectedBusinessType: (type: BusinessType) => void;
  setSelectedDesignStyle: (style: DesignStyle) => void;
  togglePOICategory: (cat: POICategory) => void;
  toggleSelectPOI: (poiId: string) => Promise<void>;
  clearRoutes: () => void;
  setTransportMode: (mode: TransportMode) => void;
  setSelectedFloor: (floor: number | 'all') => void;
  setSelectedRoomId: (roomId: string | null) => void;
  setCameraMode: (mode: CameraMode) => void;
  setShowFurniture: (show: boolean) => void;
  setShowDimensions: (show: boolean) => void;
  setView2D3DMode: (mode: '3d' | '2d' | 'split') => void;
  setTimeOfDayHours: (hours: number) => void;
  setDayOfYear: (day: number) => void;
  setWeatherMode: (weather: WeatherMode) => void;
  setAutoInteriorLights: (auto: boolean) => void;
  applyTimePreset: (preset: 'morning' | 'noon' | 'sunset' | 'night') => void;
  selectLayoutPreset: (presetId: string) => void;
  updateFurnitureItem: (id: string, patch: Partial<FurnitureItem>) => void;
  selectFurnitureItem: (id: string | null) => void;
  toggleFurnitureCategory: (cat: string) => void;
  resetStudioLayout: () => void;
  setMap3DBuildings: (enabled: boolean) => void;
  setMapPitch: (pitch: number) => void;
}

export const useSpaceVisionStore = create<SpaceVisionState>((set, get) => ({
  activeTab: 'landing',
  sidebarCollapsed: false,
  properties: DEMO_PROPERTIES,
  selectedPropertyId: initialProperty.id,
  comparedPropertyIds: DEMO_PROPERTIES.slice(0, 3).map((p) => p.id),
  searchQuery: '',
  parsedIntent: null,
  filterDistrict: 'all',
  filterMaxRent: 100,
  filterMinArea: 0,
  selectedBusinessType: initialBusinessType,
  selectedDesignStyle: initialDesignStyle,
  activePOICategories: ALL_POI_CATEGORIES,
  selectedPOIIds: [],
  transportMode: 'bike',
  activeRoutes: [],
  isRoutingLoading: false,
  selectedFloor: 'all',
  selectedRoomId: null,
  cameraMode: 'orbit',
  showFurniture: true,
  showDimensions: true,
  view2D3DMode: '3d',
  timeOfDayHours: 10.5,
  dayOfYear: 172,
  weatherMode: 'sunny',
  autoInteriorLights: true,
  activePresetId: initialPreset.id,
  furnitureItems: initialPreset.items,
  selectedFurnitureId: null,
  hiddenFurnitureCategories: [],

  // 3D Map defaults
  map3DBuildings: true,
  mapPitch: 50,

  // Onboarding & Help Guide
  showOnboardingGuide: false,
  openOnboardingGuide: () => set({ showOnboardingGuide: true }),
  closeOnboardingGuide: () => set({ showOnboardingGuide: false }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  selectProperty: (id) => {
    const state = get();
    const targetProp =
      state.properties.find((p) => p.id === id) || state.properties[0];
    const presets = generateLayoutPresets(
      targetProp,
      state.selectedBusinessType,
      state.selectedDesignStyle
    );
    const matchedPreset =
      presets.find((p) => p.id === state.activePresetId) || presets[0];

    set({
      selectedPropertyId: targetProp.id,
      selectedRoomId: null,
      selectedPOIIds: [],
      activeRoutes: [],
      isRoutingLoading: false,
      activePresetId: matchedPreset.id,
      furnitureItems: matchedPreset.items,
      selectedFurnitureId: null,
    });
  },

  exploreProperty3D: (id) => {
    get().selectProperty(id);
    set({ activeTab: 'twin' });
  },

  viewPropertyOnMap: (id) => {
    get().selectProperty(id);
    set({ activeTab: 'location' });
  },

  searchFromLanding: (query, businessType, district) => {
    const state = get();
    const trimmed = (query || '').trim();
    const intent = trimmed ? parseNaturalLanguageQuery(trimmed) : null;

    const nextBusiness =
      businessType || intent?.detectedBusiness || state.selectedBusinessType;
    const nextDistrict =
      district && district !== 'all'
        ? district
        : intent?.detectedDistrict || 'all';

    const nextMaxRent = intent?.maxBudgetMillionVND
      ? Math.max(20, Math.min(100, intent.maxBudgetMillionVND + 4))
      : 100;
    const nextMinArea = intent?.minAreaSqm
      ? Math.max(0, intent.minAreaSqm - 15)
      : 0;

    // Filter properties to match criteria
    const candidates = state.properties.filter((p) => {
      if (nextDistrict !== 'all' && p.district !== nextDistrict) return false;
      if (p.monthlyRentMillionVND > nextMaxRent) return false;
      if (p.totalAreaSqm < nextMinArea) return false;
      if (
        businessType &&
        !p.suitableBusinesses.includes(businessType)
      ) {
        return false;
      }
      return true;
    });

    const pool = candidates.length > 0 ? candidates : state.properties;
    const best = [...pool].sort((a, b) => {
      if (intent) {
        return (
          scorePropertyForIntent(b, intent, nextBusiness).overallScore -
          scorePropertyForIntent(a, intent, nextBusiness).overallScore
        );
      }
      const scoreA = a.suitableBusinesses.includes(nextBusiness) ? 10 : 0;
      const scoreB = b.suitableBusinesses.includes(nextBusiness) ? 10 : 0;
      return scoreB - scoreA;
    })[0];

    const selectedProp = best || state.properties[0];
    const presets = generateLayoutPresets(
      selectedProp,
      nextBusiness,
      state.selectedDesignStyle
    );
    const activePreset =
      presets.find((p) => p.id === state.activePresetId) || presets[0];

    set({
      activeTab: 'discovery',
      searchQuery: trimmed,
      parsedIntent: intent,
      selectedBusinessType: nextBusiness,
      filterDistrict: nextDistrict,
      filterMaxRent: nextMaxRent,
      filterMinArea: nextMinArea,
      selectedPropertyId: selectedProp.id,
      selectedPOIIds: [],
      activeRoutes: [],
      activePresetId: activePreset.id,
      furnitureItems: activePreset.items,
      selectedFurnitureId: null,
    });
  },

  toggleCompareProperty: (id) => {
    const { comparedPropertyIds } = get();
    if (comparedPropertyIds.includes(id)) {
      set({
        comparedPropertyIds: comparedPropertyIds.filter((item) => item !== id),
      });
    } else {
      if (comparedPropertyIds.length >= 3) {
        set({
          comparedPropertyIds: [...comparedPropertyIds.slice(1), id],
        });
      } else {
        set({
          comparedPropertyIds: [...comparedPropertyIds, id],
        });
      }
    }
  },

  runNaturalLanguageSearch: (query) => {
    const state = get();
    const trimmed = query.trim();
    if (!trimmed) {
      set({
        searchQuery: '',
        parsedIntent: null,
        filterDistrict: 'all',
        filterMaxRent: 100,
        filterMinArea: 0,
      });
      return;
    }

    const intent = parseNaturalLanguageQuery(trimmed);
    const nextBusiness = intent.detectedBusiness || state.selectedBusinessType;
    const nextDistrict = intent.detectedDistrict || 'all';
    const nextMaxRent = intent.maxBudgetMillionVND
      ? Math.max(20, Math.min(100, intent.maxBudgetMillionVND + 4))
      : 100;
    const nextMinArea = intent.minAreaSqm
      ? Math.max(0, intent.minAreaSqm - 15)
      : 0;

    // Filter and rank properties to auto-select the best match
    const candidates = state.properties.filter((p) => {
      if (nextDistrict !== 'all' && p.district !== nextDistrict) return false;
      if (p.monthlyRentMillionVND > nextMaxRent) return false;
      if (p.totalAreaSqm < nextMinArea) return false;
      return true;
    });

    const pool = candidates.length > 0 ? candidates : state.properties;
    const best = [...pool].sort(
      (a, b) =>
        scorePropertyForIntent(b, intent, nextBusiness).overallScore -
        scorePropertyForIntent(a, intent, nextBusiness).overallScore
    )[0];

    const selectedProp = best || state.properties[0];
    const presets = generateLayoutPresets(
      selectedProp,
      nextBusiness,
      state.selectedDesignStyle
    );
    const activePreset =
      presets.find((p) => p.id === state.activePresetId) || presets[0];

    set({
      searchQuery: trimmed,
      parsedIntent: intent,
      selectedBusinessType: nextBusiness,
      filterDistrict: nextDistrict,
      filterMaxRent: nextMaxRent,
      filterMinArea: nextMinArea,
      selectedPropertyId: selectedProp.id,
      selectedPOIIds: [],
      activeRoutes: [],
      activePresetId: activePreset.id,
      furnitureItems: activePreset.items,
      selectedFurnitureId: null,
    });
  },

  setFilterDistrict: (district) => set({ filterDistrict: district }),

  setFilterMaxRent: (maxRent) => set({ filterMaxRent: maxRent }),

  setFilterMinArea: (minArea) => set({ filterMinArea: minArea }),

  setSelectedBusinessType: (type) => {
    const state = get();
    const currentProp =
      state.properties.find((p) => p.id === state.selectedPropertyId) ||
      state.properties[0];
    const presets = generateLayoutPresets(
      currentProp,
      type,
      state.selectedDesignStyle
    );
    const chosenPreset =
      presets.find((p) => p.id === state.activePresetId) || presets[0];

    set({
      selectedBusinessType: type,
      activePresetId: chosenPreset.id,
      furnitureItems: chosenPreset.items,
      selectedFurnitureId: null,
    });
  },

  setSelectedDesignStyle: (style) => {
    const state = get();
    const palette = DESIGN_STYLE_META[style];
    const updatedFurniture = state.furnitureItems.map((item) => {
      if (item.category === 'decor') return item;
      if (item.category === 'signage' || item.assetType === 'lounge_sofa') {
        return { ...item, color: palette.accentColor };
      }
      if (item.category === 'storage' && item.assetType !== 'display_island') {
        return { ...item, color: palette.metalTone };
      }
      return { ...item, color: palette.woodTone };
    });

    set({
      selectedDesignStyle: style,
      furnitureItems: updatedFurniture,
    });
  },

  togglePOICategory: (cat) => {
    const { activePOICategories } = get();
    if (activePOICategories.includes(cat)) {
      set({
        activePOICategories: activePOICategories.filter((c) => c !== cat),
      });
    } else {
      set({
        activePOICategories: [...activePOICategories, cat],
      });
    }
  },

  toggleSelectPOI: async (poiId) => {
    const state = get();
    const currentProp =
      state.properties.find((p) => p.id === state.selectedPropertyId) ||
      state.properties[0];
    if (!currentProp) return;

    if (state.selectedPOIIds.includes(poiId)) {
      set({
        selectedPOIIds: state.selectedPOIIds.filter((id) => id !== poiId),
        activeRoutes: state.activeRoutes.filter((r) => r.poiId !== poiId),
      });
      return;
    }

    const targetPOI = currentProp.nearbyPOIs.find((p) => p.id === poiId);
    if (!targetPOI) return;

    set({
      selectedPOIIds: [...state.selectedPOIIds, poiId],
      isRoutingLoading: true,
    });

    try {
      const routeResult = await fetchRouteToPOI(
        currentProp.coordinates,
        targetPOI.coordinates,
        targetPOI.id,
        targetPOI.name,
        get().transportMode
      );

      set((curr) => ({
        activeRoutes: [
          ...curr.activeRoutes.filter((r) => r.poiId !== poiId),
          routeResult,
        ],
        isRoutingLoading: false,
      }));
    } catch {
      set({ isRoutingLoading: false });
    }
  },

  clearRoutes: () =>
    set({
      selectedPOIIds: [],
      activeRoutes: [],
      isRoutingLoading: false,
    }),

  setTransportMode: (mode) => {
    const state = get();
    set({ transportMode: mode });

    if (state.selectedPOIIds.length === 0) return;

    const currentProp =
      state.properties.find((p) => p.id === state.selectedPropertyId) ||
      state.properties[0];
    if (!currentProp) return;

    set({ isRoutingLoading: true });
    Promise.all(
      state.selectedPOIIds.map(async (poiId) => {
        const poi = currentProp.nearbyPOIs.find((p) => p.id === poiId);
        if (!poi) return null;
        return fetchRouteToPOI(
          currentProp.coordinates,
          poi.coordinates,
          poi.id,
          poi.name,
          mode
        );
      })
    )
      .then((results) => {
        const valid = results.filter((r): r is RouteResult => r !== null);
        set({ activeRoutes: valid, isRoutingLoading: false });
      })
      .catch(() => {
        set({ isRoutingLoading: false });
      });
  },

  setSelectedFloor: (floor) => set({ selectedFloor: floor }),

  setSelectedRoomId: (roomId) => set({ selectedRoomId: roomId }),

  setCameraMode: (mode) => set({ cameraMode: mode }),

  setShowFurniture: (show) => set({ showFurniture: show }),

  setShowDimensions: (show) => set({ showDimensions: show }),

  setView2D3DMode: (mode) => set({ view2D3DMode: mode }),

  setTimeOfDayHours: (hours) =>
    set({ timeOfDayHours: Math.max(0, Math.min(24, hours)) }),

  setDayOfYear: (day) =>
    set({ dayOfYear: Math.max(1, Math.min(365, Math.round(day))) }),

  setWeatherMode: (weather) => set({ weatherMode: weather }),

  setAutoInteriorLights: (auto) => set({ autoInteriorLights: auto }),

  applyTimePreset: (preset) => {
    const map: Record<'morning' | 'noon' | 'sunset' | 'night', number> = {
      morning: 7.5,
      noon: 12.0,
      sunset: 17.75,
      night: 20.5,
    };
    set({ timeOfDayHours: map[preset] });
  },

  selectLayoutPreset: (presetId) => {
    const state = get();
    const currentProp =
      state.properties.find((p) => p.id === state.selectedPropertyId) ||
      state.properties[0];
    const presets = generateLayoutPresets(
      currentProp,
      state.selectedBusinessType,
      state.selectedDesignStyle
    );
    const chosen = presets.find((p) => p.id === presetId) || presets[0];
    set({
      activePresetId: chosen.id,
      furnitureItems: chosen.items,
      selectedFurnitureId: null,
    });
  },

  updateFurnitureItem: (id, patch) => {
    set((state) => ({
      furnitureItems: state.furnitureItems.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    }));
  },

  selectFurnitureItem: (id) => set({ selectedFurnitureId: id }),

  toggleFurnitureCategory: (cat) => {
    const { hiddenFurnitureCategories } = get();
    if (hiddenFurnitureCategories.includes(cat)) {
      set({
        hiddenFurnitureCategories: hiddenFurnitureCategories.filter(
          (c) => c !== cat
        ),
      });
    } else {
      set({
        hiddenFurnitureCategories: [...hiddenFurnitureCategories, cat],
      });
    }
  },

  resetStudioLayout: () => {
    const state = get();
    const currentProp =
      state.properties.find((p) => p.id === state.selectedPropertyId) ||
      state.properties[0];
    const presets = generateLayoutPresets(
      currentProp,
      state.selectedBusinessType,
      state.selectedDesignStyle
    );
    const chosen =
      presets.find((p) => p.id === state.activePresetId) || presets[0];

    set({
      activePresetId: chosen.id,
      furnitureItems: chosen.items,
      selectedFurnitureId: null,
      hiddenFurnitureCategories: [],
    });
  },

  setMap3DBuildings: (enabled) => set({ map3DBuildings: enabled }),

  setMapPitch: (pitch) => set({ mapPitch: pitch }),
}));
