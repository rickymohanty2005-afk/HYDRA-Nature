/**
 * Resolves any image URL to a displayable URL.
 * - Client static assets (/images/...) stay same-origin (served by the CDN)
 * - Backend uploads (/uploads/...) resolve to the API origin
 */
export const getImageUrl = (url?: string): string => {
  if (!url) return '';

  const apiBase = import.meta.env.VITE_API_BASE_URL || '';
  const backendOrigin = apiBase.replace(/\/api\/?$/, '');
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

  if (url.startsWith('data:') || url.startsWith('blob:')) return url;

  if (url.startsWith('http://') || url.startsWith('https://')) {
    // Legacy localhost upload URLs -> active backend
    const m = url.match(/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(\/uploads\/.*)$/);
    if (m) return `${backendOrigin}${m[1]}`;
    // Avoid mixed-content blocking on https sites
    if (isHttps && url.startsWith('http://') && !/^http:\/\/(localhost|127\.0\.0\.1)/.test(url)) {
      return url.replace(/^http:\/\//, 'https://');
    }
    return url;
  }

  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  if (cleanPath.startsWith('/uploads/')) return `${backendOrigin}${cleanPath}`;
  return cleanPath;
};
