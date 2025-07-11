/**
 * Safely parses date values from database or user input
 * Handles null, undefined, malformed strings, and invalid dates
 * @param dateValue - The date value to parse (can be string, Date, null, undefined, etc.)
 * @param context - The context in which the date is being used to determine appropriate defaults
 * @returns A valid Date object with context-specific defaults if parsing fails
 */
export const parseSafeDate = (dateValue: any, context: 'eatByDate' | 'dateCookedStored' | 'general' = 'general'): Date => {
  // Handle null, undefined, or empty values
  if (!dateValue) {
    return getContextDefault(context);
  }
  
  // Handle string values
  if (typeof dateValue === 'string') {
    const trimmed = dateValue.trim();
    if (!trimmed) {
      return getContextDefault(context);
    }
    
    const parsed = new Date(trimmed);
    // Check if the parsed date is valid
    if (isNaN(parsed.getTime())) {
      console.warn(`Invalid date value: ${dateValue}, using context-specific default for ${context}`);
      return getContextDefault(context);
    }
    
    return parsed;
  }
  
  // Handle Date objects
  if (dateValue instanceof Date) {
    if (isNaN(dateValue.getTime())) {
      console.warn(`Invalid Date object, using context-specific default for ${context}`);
      return getContextDefault(context);
    }
    return dateValue;
  }
  
  // For any other type, try to create a Date object
  const parsed = new Date(dateValue);
  if (isNaN(parsed.getTime())) {
    console.warn(`Unable to parse date value: ${dateValue}, using context-specific default for ${context}`);
    return getContextDefault(context);
  }
  
  return parsed;
};

/**
 * Gets context-specific default dates for different use cases
 * @param context - The context in which the date is being used
 * @returns A Date object appropriate for the given context
 */
const getContextDefault = (context: 'eatByDate' | 'dateCookedStored' | 'general'): Date => {
  const now = new Date();
  
  switch (context) {
    case 'eatByDate':
      // Default to 7 days in the future to prevent false expiration alerts
      // This gives users time to notice and handle the item
      return new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
    
    case 'dateCookedStored':
      // Default to 1 day ago since it represents when food was cooked/stored
      // This is more realistic than defaulting to today
      return new Date(now.getTime() - (24 * 60 * 60 * 1000));
    
    case 'general':
    default:
      // Default to current date for general use cases
      return now;
  }
};

/**
 * Parses a date specifically for eatByDate context
 * @param dateValue - The date value to parse
 * @returns A valid Date object, defaults to 7 days in the future if parsing fails
 */
export const parseEatByDate = (dateValue: any): Date => {
  return parseSafeDate(dateValue, 'eatByDate');
};

/**
 * Parses a date specifically for dateCookedStored context
 * @param dateValue - The date value to parse
 * @returns A valid Date object, defaults to 1 day ago if parsing fails
 */
export const parseDateCookedStored = (dateValue: any): Date => {
  return parseSafeDate(dateValue, 'dateCookedStored');
};