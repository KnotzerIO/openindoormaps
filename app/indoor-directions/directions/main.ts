import Graph from "../pathfinding/graph";
import PathFinder from "../pathfinding/pathfinder";
import { MapLibreGlDirectionsConfiguration } from "../types";
import { buildConfiguration, buildPoint, buildRouteLines } from "./utils";
export default class IndoorDirections {
  protected declare readonly map: maplibregl.Map;
  private readonly pathFinder: PathFinder;

  protected readonly configuration: MapLibreGlDirectionsConfiguration;

  protected buildPoint = buildPoint;
  protected buildRouteLines = buildRouteLines;

  protected _waypoints: GeoJSON.Feature<GeoJSON.Point>[] = [];
  protected routelines: GeoJSON.Feature<GeoJSON.LineString>[][] = [];

  constructor(
    map: maplibregl.Map,
    configuration?: Partial<MapLibreGlDirectionsConfiguration>,
  ) {
    this.map = map;

    this.configuration = buildConfiguration(configuration);
    this.pathFinder = new PathFinder();

    this.init();
  }

  protected init() {
    this.map.addSource(this.configuration.sourceName, {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [],
      },
    });

    this.configuration.layers.forEach((layer) => {
      this.map.addLayer(layer);
    });
  }

  public async loadMapData(url: string) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load GeoJSON: ${response.statusText}`);
      }
      const geoJsonData: GeoJSON.FeatureCollection = await response.json();
      this.parseGeoJsonToGraph(geoJsonData);
    } catch (error) {
      console.error("Error loading GeoJSON data:", error);
    }
  }

  private calculateDistance(
    coord1: GeoJSON.Position,
    coord2: GeoJSON.Position,
  ) {
    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private parseGeoJsonToGraph(geoJson: GeoJSON.FeatureCollection) {
    const coordMap = new Map<string, Set<GeoJSON.Position[]>>();
    const graph = new Graph();

    geoJson.features.forEach((feature) => {
      if (feature.geometry.type === "LineString" && feature.properties) {
        const coordinates = feature.geometry.coordinates;

        coordinates.forEach((coord) => {
          const key = JSON.stringify(coord);
          if (!coordMap.has(key)) {
            coordMap.set(key, new Set());
          }
          coordMap.get(key)?.add(coordinates);
        });
      }
    });

    geoJson.features.forEach((feature) => {
      if (feature.geometry.type === "LineString" && feature.properties) {
        const coordinates = feature.geometry.coordinates;

        for (let i = 0; i < coordinates.length - 1; i++) {
          const from = JSON.stringify(coordinates[i]);
          const to = JSON.stringify(coordinates[i + 1]);

          // Calculate distance as weight
          const weight = this.calculateDistance(
            coordinates[i],
            coordinates[i + 1],
          );

          graph.addEdge(from, to, weight);

          const fromOverlaps = coordMap.get(from);
          if (fromOverlaps && fromOverlaps.size > 1) {
            fromOverlaps.forEach((otherCoords) => {
              if (otherCoords == coordinates) {
                const idx = otherCoords.findIndex(
                  (c) => JSON.stringify(c) === from,
                );
                if (idx !== -1) {
                  if (idx > 0) {
                    graph.addEdge(
                      from,
                      JSON.stringify(otherCoords[idx - 1]),
                      weight,
                    );
                  }
                  if (idx < otherCoords.length - 1) {
                    graph.addEdge(
                      from,
                      JSON.stringify(otherCoords[idx + 1]),
                      weight,
                    );
                  }
                }
              }
            });
          }
        }
      }
    });

    this.pathFinder.setGraph(graph);
  }
  /**
   * Replaces all the waypoints with the specified ones and re-fetches the routes.
   *
   * @param waypoints The coordinates at which the waypoints should be added
   */
  public setWaypoints(waypoints: [number, number][]) {
    this._waypoints = waypoints.map((coord) => buildPoint(coord, "WAYPOINT"));
    this.assignWaypointsCategories();

    //TODO: this.fire();

    this.calculateDirections();
    this.draw();
  }

  protected calculateDirections() {
    const routes: GeoJSON.Position[] = [];

    for (let i = 0; i < this._waypoints.length - 1; i++) {
      const start = this._waypoints[i].geometry.coordinates;
      const end = this._waypoints[i + 1].geometry.coordinates;

      const segmentRoute = this.pathFinder.dijkstra(start, end);

      if (i === 0) {
        routes.push(...segmentRoute);
      } else {
        routes.push(...segmentRoute.slice(1));
      }
    }

    this.routelines.push(this.buildRouteLines(routes));
  }

  protected draw() {
    const features = [...this._waypoints, ...this.routelines.flat()];
    const geoJson: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features,
    };

    if (this.map.getSource(this.configuration.sourceName)) {
      (
        this.map.getSource(
          this.configuration.sourceName,
        ) as maplibregl.GeoJSONSource
      ).setData(geoJson);
    }
  }

  protected assignWaypointsCategories() {
    this._waypoints.forEach((waypoint, index) => {
      let category;
      if (index === 0) {
        category = "ORIGIN";
      } else if (index === this._waypoints.length - 1) {
        category = "DESTINATION";
      } else {
        category = undefined;
      }

      if (waypoint.properties) {
        waypoint.properties.index = index;
        waypoint.properties.category = category;
      }
    });
  }
}