import { describe, expect, it } from 'vitest';
import { isValidGeoJsonPoint, toGeoJsonPoint } from '../../../src/utils/geoJson.js';

describe('geoJson utils', () => {
  describe('isValidGeoJsonPoint', () => {
    it('acepta coordenadas válidas [longitud, latitud]', () => {
      expect(isValidGeoJsonPoint([-67.6061, 10.2469])).toBe(true);
      expect(isValidGeoJsonPoint([-180, -90])).toBe(true);
      expect(isValidGeoJsonPoint([180, 90])).toBe(true);
    });

    it('rechaza arrays inválidos', () => {
      expect(isValidGeoJsonPoint(null)).toBe(false);
      expect(isValidGeoJsonPoint([-67])).toBe(false);
      expect(isValidGeoJsonPoint([-67, 10, 0])).toBe(false);
      expect(isValidGeoJsonPoint(['-67', '10'])).toBe(false);
    });

    it('rechaza coordenadas fuera de rango', () => {
      expect(isValidGeoJsonPoint([-181, 10])).toBe(false);
      expect(isValidGeoJsonPoint([-67, 91])).toBe(false);
    });
  });

  describe('toGeoJsonPoint', () => {
    it('convierte a objeto GeoJSON Point', () => {
      const coordinates = [-67.6061, 10.2469];
      expect(toGeoJsonPoint(coordinates)).toEqual({
        type: 'Point',
        coordinates,
      });
    });
  });
});
