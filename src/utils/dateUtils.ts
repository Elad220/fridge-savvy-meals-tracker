/**
 * Safely parses date values from database or user input
 * Handles null, undefined, malformed strings, and invalid dates
 * @param dateValue - The date value to parse (can be string, Date, null, undefined, etc.)
 * @returns A valid Date object, defaults to current date if parsing fails
 */
export const parseSafeDate = (dateValue: any): Date => {
  // Handle null, undefined, or empty values
  if (!dateValue) {
    return new Date(); // Default to current date
  }
  
  // Handle string values
  if (typeof dateValue === 'string') {
    const trimmed = dateValue.trim();
    if (!trimmed) {
      return new Date(); // Default to current date for empty strings
    }
    
    const parsed = new Date(trimmed);
    // Check if the parsed date is valid
    if (isNaN(parsed.getTime())) {
      console.warn(`Invalid date value: ${dateValue}, using current date as fallback`);
      return new Date(); // Default to current date for invalid dates
    }
    
    return parsed;
  }
  
  // Handle Date objects
  if (dateValue instanceof Date) {
    if (isNaN(dateValue.getTime())) {
      console.warn('Invalid Date object, using current date as fallback');
      return new Date();
    }
    return dateValue;
  }
  
  // For any other type, try to create a Date object
  const parsed = new Date(dateValue);
  if (isNaN(parsed.getTime())) {
    console.warn(`Unable to parse date value: ${dateValue}, using current date as fallback`);
    return new Date();
  }
  
  return parsed;
};