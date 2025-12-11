/**
 * Image utility functions for handling image paths and URLs
 * Centralized logic for constructing full URLs from relative paths
 */

// Base URL for images - should match backend BASE_URL (without trailing slash)
const BASE_URL = (process.env.NEXT_PUBLIC_IMAGE_BASE_URL || 'https://webnox.blr1.digitaloceanspaces.com').trim().replace(/\/$/, '');

/**
 * Get the base URL for images from environment variables
 */
export function getImageBaseUrl(): string {
  return BASE_URL;
}

/**
 * Construct full image URL from relative path
 * @param relativePath - Relative path from database (e.g., "Scrap_Service/lead/vehicles/images/uuid.jpg")
 * @returns Full URL (e.g., "https://webnox.blr1.digitaloceanspaces.com/Scrap_Service/lead/vehicles/images/uuid.jpg")
 */
export function getImageUrl(relativePath: string | null | undefined): string {
  if (!relativePath) return '';
  
  // If already a full URL, return as is (for backward compatibility)
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  
  // Construct full URL (baseUrl has no trailing slash)
  const baseUrl = getImageBaseUrl();
  const cleanPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
  return `${baseUrl}/${cleanPath}`;
}

/**
 * Construct full image URLs from array of relative paths
 * @param relativePaths - Array of relative paths
 * @returns Array of full URLs
 */
export function getImageUrls(relativePaths: (string | null | undefined)[]): string[] {
  return relativePaths
    .filter((path): path is string => !!path)
    .map(path => getImageUrl(path));
}

/**
 * Extract relative path from full URL (for backward compatibility)
 * @param fullUrl - Full URL
 * @returns Relative path
 */
export function getRelativePath(fullUrl: string | null | undefined): string {
  if (!fullUrl) return '';
  
  // If already a relative path, return as is
  if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
    return fullUrl;
  }
  
  // Extract path from URL
  try {
    const url = new URL(fullUrl);
    return url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
  } catch {
    // If URL parsing fails, try to extract manually
    const baseUrl = getImageBaseUrl();
    const baseUrlIndex = fullUrl.indexOf(baseUrl);
    if (baseUrlIndex !== -1) {
      return fullUrl.substring(baseUrlIndex + baseUrl.length).replace(/^\//, '');
    }
    return fullUrl;
  }
}

/**
 * Normalize image paths - convert full URLs to relative paths if needed
 * @param paths - Array of paths (can be full URLs or relative paths)
 * @returns Array of relative paths
 */
export function normalizeImagePaths(paths: (string | null | undefined)[]): string[] {
  return paths
    .filter((path): path is string => !!path)
    .map(path => getRelativePath(path));
}
