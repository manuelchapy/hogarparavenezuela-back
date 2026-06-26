import { describe, expect, it } from 'vitest';
import { AppError } from '../../../src/errors/AppError.js';

describe('AppError', () => {
  it('crea error operacional con status y mensaje', () => {
    const error = new AppError('No encontrado', 404, { id: 'x' });

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('No encontrado');
    expect(error.statusCode).toBe(404);
    expect(error.details).toEqual({ id: 'x' });
    expect(error.isOperational).toBe(true);
  });

  it('usa 500 por defecto', () => {
    const error = new AppError('Fallo interno');
    expect(error.statusCode).toBe(500);
  });
});
