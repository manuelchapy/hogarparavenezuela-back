import { describe, expect, it } from 'vitest';
import { ubicacionInputSchema } from '../../../src/validators/geo.validator.js';
import { GEO_CITY_ID, GEO_MUNICIPALITY_ID, GEO_PARISH_ID, GEO_STATE_ID } from '../../fixtures/index.js';

describe('geo.validator', () => {
  it('exige estado y ciudad', () => {
    const valid = ubicacionInputSchema.safeParse({
      state: GEO_STATE_ID,
      city: GEO_CITY_ID,
    });

    const invalid = ubicacionInputSchema.safeParse({
      state: GEO_STATE_ID,
    });

    expect(valid.success).toBe(true);
    expect(invalid.success).toBe(false);
  });

  it('acepta municipio y parroquia opcionales', () => {
    const result = ubicacionInputSchema.safeParse({
      state: GEO_STATE_ID,
      city: GEO_CITY_ID,
      municipality: GEO_MUNICIPALITY_ID,
      parish: GEO_PARISH_ID,
    });

    expect(result.success).toBe(true);
  });
});
