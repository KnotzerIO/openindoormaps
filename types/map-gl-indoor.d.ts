// types/map-gl-indoor.d.ts

declare module "map-gl-indoor" {
  import { BBox, FeatureCollection, Geometry } from "geojson";
  import { Map, Listener } from "maplibre-gl";

  export type Level = number;
  export type LevelsRange = {
    min: Level;
    max: Level;
  };

  export type IndoorMapOptions = {
    beforeLayerId?: string;
    defaultLevel?: number;
    layers?: Array<LayerSpecification>;
    layersToHide?: Array<string>;
    showFeaturesWithEmptyLevel?: boolean;
  };

  export type IndoorMapGeoJSON = FeatureCollection<Geometry>;
  export type LayerSpecification = any;
  export type FilterSpecification = any[] | null;

  export type IndoorMapEvent =
    | "indoor.map.loaded"
    | "indoor.map.unloaded"
    | "indoor.level.changed";

  export type MaplibreMapWithIndoor = Map & {
    indoor: IndoorLayer;
    on(type: IndoorMapEvent, listener: Listener): Map;
    off(type: IndoorMapEvent, listener: Listener): Map;
  };

  export class IndoorMap {
    bounds: BBox;
    geojson: IndoorMapGeoJSON;
    layers: Array<LayerSpecification>;
    levelsRange: LevelsRange;
    beforeLayerId?: string;
    layersToHide: Array<string>;
    defaultLevel: number;
    showFeaturesWithEmptyLevel: boolean;

    constructor(
      bounds: BBox,
      geojson: IndoorMapGeoJSON,
      layers: Array<LayerSpecification>,
      levelsRange: LevelsRange,
      layersToHide: Array<string>,
      defaultLevel: number,
      showFeaturesWithEmptyLevel: boolean,
      beforeLayerId?: string,
    );

    static fromGeojson(
      geojson: IndoorMapGeoJSON,
      options?: IndoorMapOptions,
    ): IndoorMap;
  }

  export class IndoorLayer {
    _map: Map;
    _level: Level | null;
    _indoorMaps: Array<IndoorMap>;
    _selectedMap: IndoorMap | null;

    constructor(map: Map);
    getSelectedMap(): IndoorMap | null;
    getLevel(): Level | null;
    setLevel(level: Level | null, fireEvent?: boolean): void;
    addMap(map: IndoorMap): Promise<void>;
    removeMap(map: IndoorMap): Promise<void>;
  }

  export class IndoorControl {
    _map?: MaplibreMapWithIndoor;
    _indoor?: IndoorLayer;
    _indoorMap: IndoorMap | null;
    _container?: HTMLElement;

    constructor();
    onAdd(map: Map): HTMLDivElement;
    onRemove(): void;
  }

  export function addIndoorTo(map: Map): MaplibreMapWithIndoor;
}
