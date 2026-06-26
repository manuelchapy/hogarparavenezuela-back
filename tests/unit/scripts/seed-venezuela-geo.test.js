import { describe, expect, it } from 'vitest';
import {
  loadVenezuelaData,
  normalizeName,
  summarizeVenezuelaData,
} from '../../../scripts/seed-venezuela-geo.js';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dataPath = join(dirname(fileURLToPath(import.meta.url)), '../../../src/utils/venezuela.json');

describe('seed-venezuela-geo', () => {
  it('normaliza nombres con espacios y puntos finales', () => {
    expect(normalizeName('  El Carmen.  ')).toBe('El Carmen');
    expect(normalizeName('Maroa')).toBe('Maroa');
  });

  it('carga el JSON de Venezuela con estados y municipios', () => {
    const rows = loadVenezuelaData(dataPath);

    expect(rows.length).toBeGreaterThan(20);
    expect(rows[0]).toMatchObject({
      iso_31662: 'VE-X',
      estado: 'Amazonas',
      id_estado: 1,
    });
    expect(rows[0].municipios.length).toBeGreaterThan(0);
    expect(rows[0].municipios[0].parroquias.length).toBeGreaterThan(0);
  });

  it('resume totales esperados del catálogo', () => {
    const rows = loadVenezuelaData(dataPath);
    const summary = summarizeVenezuelaData(rows);

    expect(summary.states).toBe(24);
    expect(summary.municipalities).toBeGreaterThan(300);
    expect(summary.parishes).toBeGreaterThan(1000);
    expect(summary.citiesFromSource).toBeGreaterThan(100);
  });
});
