/**
 * Shortens a URL for display purposes
 * @param url - The full URL to shorten
 * @param maxLength - Maximum length for the shortened URL (default: 50)
 * @returns Shortened URL string
 */
export const shortenUrl = (url: string, maxLength: number = 50): string => {
  if (!url || typeof url !== 'string') {
    return url || '';
  }

  // Remove protocol if present
  let displayUrl = url.replace(/^https?:\/\//, '');
  
  // Remove www. if present
  displayUrl = displayUrl.replace(/^www\./, '');
  
  // If URL is still longer than maxLength, truncate and add ellipsis
  if (displayUrl.length > maxLength) {
    displayUrl = displayUrl.substring(0, maxLength - 3) + '...';
  }
  
  return displayUrl;
};

/**
 * Checks if a string is a valid URL
 * @param str - String to check
 * @returns boolean indicating if string is a valid URL
 */
export const isValidUrl = (str: string): boolean => {
  if (!str || typeof str !== 'string') {
    return false;
  }
  
  try {
    // Try to create a URL object - if it succeeds, it's a valid URL
    const url = new URL(str.startsWith('http') ? str : `https://${str}`);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Formats a URL to ensure it has a protocol
 * @param url - The URL to format
 * @returns Formatted URL with protocol
 */
export const formatUrl = (url: string): string => {
  if (!url || typeof url !== 'string') {
    return '';
  }
  
  // If URL already has protocol, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Otherwise, add https://
  return `https://${url}`;
};

