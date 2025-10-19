/**
 * Convert string to URL-friendly slug
 */
export const toSlug = (str: string): string => {
  return str
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')           // spaces to hyphens
    .replace(/[^a-z0-9\-а-яё]/g, '') // remove special chars, keep cyrillic
    .replace(/\-+/g, '-')           // collapse multiple hyphens
    .replace(/^-+|-+$/g, '');       // trim hyphens from start/end
};