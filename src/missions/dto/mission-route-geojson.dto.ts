export class MissionRouteGeoJsonDto {
  type: 'Feature';
  geometry: {
    type: 'LineString';
    coordinates: number[][];
  };
  properties: {
    missionId: number;
  };
}