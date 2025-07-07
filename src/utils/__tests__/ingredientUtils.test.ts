/// <reference types="vitest" />
import { describe, expect, it } from 'vitest';
import { parseIngredients, singularize, normalise } from '../ingredientUtils';

describe('ingredient utils', () => {
  it('singularize basic plurals', () => {
    expect(singularize('tomatoes')).toBe('tomato');
    expect(singularize('berries')).toBe('berry');
    expect(singularize('beans')).toBe('bean');
    expect(singularize('glass')).toBe('glass');
  });

  it('normalise removes punctuation and lowercases', () => {
    expect(normalise('Fresh Tomatoes!')).toBe('fresh tomato');
  });

  it('parseIngredients recognises different delimiters and headers', () => {
    const notes = `Ingredients: Chicken, onions; Garlic\nInstructions: Cook well`;
    expect(parseIngredients(notes)).toEqual(['chicken', 'onions', 'garlic']);
  });
});