/**
 * Resolves any image URL to a displayable URL.
 * - Client static assets (/images/...) stay same-origin (served by the CDN)
 * - Backend uploads (/uploads/...) resolve to the API origin
 */
export const getImageUrl = (url?: string): string => {
  const trimmed = url?.trim();
  if (!trimmed) return '';

  const apiBase = import.meta.env.VITE_API_BASE_URL || '';
  const backendOrigin = apiBase.replace(/\/api\/?$/, '');
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // Legacy localhost upload URLs -> active backend
    const m = trimmed.match(/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(\/uploads\/.*)$/);
    if (m) return `${backendOrigin}${m[1]}`;
    // Avoid mixed-content blocking on https sites
    if (isHttps && trimmed.startsWith('http://') && !/^http:\/\/(localhost|127\.0\.0\.1)/.test(trimmed)) {
      return trimmed.replace(/^http:\/\//, 'https://');
    }
    return trimmed;
  }

  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  if (cleanPath.startsWith('/uploads/')) return `${backendOrigin}${cleanPath}`;
  return cleanPath;
};

/**
 * Returns true if the given media URL points to a video (Cloudinary /video/upload/ or video file extension).
 */
export const isVideoUrl = (url?: string): boolean => {
  if (!url) return false;
  const lower = url.trim().toLowerCase();
  if (lower.startsWith('data:video/')) return true;
  if (lower.includes('/video/upload/')) return true;
  return /\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/i.test(lower);
};
