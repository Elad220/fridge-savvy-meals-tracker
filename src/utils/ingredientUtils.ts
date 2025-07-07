import { FoodItem } from '@/types';

/**
 * Naively convert a plural English noun to its singular form for basic matching.
 * IMPORTANT: This is heuristic and not linguistically complete.
 */
export const singularize = (word: string): string => {
  const lower = word.toLowerCase().trim();
  if (lower.endsWith('ies')) return lower.slice(0, -3) + 'y'; // berries -> berry
  if (lower.endsWith('oes')) return lower.slice(0, -2);       // tomatoes -> tomato
  if (lower.endsWith('ses')) return lower.slice(0, -2);       // classes -> class
  if (lower.endsWith('s') && !lower.endsWith('ss')) return lower.slice(0, -1); // beans -> bean
  return lower;
};

/**
 * Normalise an ingredient or item name for fuzzy comparison.
 */
export const normalise = (str: string): string => singularize(str.replace(/[^a-zA-Z0-9 ]/g, '').toLowerCase().trim());

/**
 * Parse a free-text note string and extract a unique list of ingredient names.
 * The function recognises common delimiters and headers, ignoring case.
 */
export const parseIngredients = (notes?: string): string[] => {
  if (!notes) return [];

  // Remove brackets & carriage returns, lower-case for easier regex.
  const cleaned = notes
    .replace(/[\[\]\(\)]/g, '')
    .replace(/\r/g, '')
    .toLowerCase();

  // If an "ingredients" header exists, trim everything before it.
  const headerRegex = /ingredients?[:\-]?/i;
  let section = cleaned;
  const headerIdx = cleaned.search(headerRegex);
  if (headerIdx !== -1) {
    section = cleaned.slice(headerIdx + cleaned.match(headerRegex)![0].length);
  }

  // Stop at other headings (instructions, method, etc.).
  const stopIdx = section.search(/(^|\n)(instructions?|method|steps?|tips?|directions?|prep time|cook time|difficulty)/i);
  if (stopIdx !== -1) {
    section = section.slice(0, stopIdx);
  }

  // Convert various delimiters (bullets, new-lines, semicolons) to commas.
  const tokens = section
    .replace(/[•;\n\u2022]/g, ',')
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0 && t !== 'and');

  // Return unique list.
  return Array.from(new Set(tokens));
};

/**
 * Try to find the best matching FoodItem in inventory for a given ingredient text.
 * Uses the normalise() helper for simple fuzzy matching.
 */
export const findMatchingItem = (ingredient: string, inventory: FoodItem[]): FoodItem | undefined => {
  const ingNorm = normalise(ingredient);
  return inventory.find(item => {
    const itemNorm = normalise(item.name);
    return itemNorm === ingNorm || itemNorm.includes(ingNorm) || ingNorm.includes(itemNorm);
  });
};